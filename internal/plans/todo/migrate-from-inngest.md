# Migrate 6 Inngest Functions to Convex Workflows

## Context

We've already migrated `designExecute` from Inngest to Convex Workflow successfully. Now we're migrating the remaining 6 Inngest functions using the same proven pattern: Convex mutation → workflow.start() → action fires sandbox → sandbox calls back → workflow saves result.

All 6 functions follow the same shape: fetch data → setup sandbox → run Claude CLI → stream activity → save results. The differences are in prompts, models, tools, and what they do with the result.

---

## Shared Infrastructure Changes

### 1. Move `getDesignTokens` to shared location

**`apps/web/app/(main)/[repo]/actions.ts`** — rename to `getWorkflowTokens`, make generic:

```ts
export async function getWorkflowTokens(
  installationId: number,
): Promise<{ githubToken: string; convexToken: string }>;
```

Update `apps/web/app/(main)/[repo]/design/actions.ts` to re-export from parent, or update design imports to use the new path.

### 2. Generalize `daytona.ts` sandbox utilities

**`packages/backend/convex/daytona.ts`** — extract shared helpers:

- `launchScript(sandbox, prompt, script, convexUrl, convexToken, entityId, extraEnvVars?)` — uploads prompt + script files, runs `nohup node /tmp/run-handler.mjs &`
- `setupBranch(sandbox, branchName)` — creates or checks out a git branch (needed by `generateTests`)
- `buildCallbackScript(completionMutation, options?)` — generic version of `buildCallbackHandlerScript` that takes the completion mutation path as a parameter. The streaming, activity parsing, and label logic is identical across all workflows.

Keep `setupAndExecuteDesign` as-is (it calls the shared utilities internally). New workflow actions will also call these utilities.

### 3. Generic callback script builder

The current `buildCallbackHandlerScript()` is 95% generic. The only design-specific part is the completion mutation path (`"designWorkflow:handleCompletion"`). Parameterize this:

```ts
function buildCallbackScript(
  completionMutation: string,
  opts?: { model?: string; tools?: string; systemPrompt?: string },
): string;
```

For multi-run workflows (evaluateDoc, docInterview, interviewQuestion), build custom scripts that run Claude CLI sequentially with conditional logic.

---

## Per-Function Migration

### Function 1: `summarizeSession` (simplest)

**Current**: `apps/web/lib/inngest/functions/summarize-session.ts`
**Event**: `session/summary.generate`
**Frontend trigger**: `apps/web/app/(main)/[repo]/sessions/[id]/ChatPanel.tsx` line 187

**New files:**

- **`packages/backend/convex/summarizeWorkflow.ts`** — workflow + helpers

**Workflow steps:**

1. `step.runQuery` — fetch session messages + repo data
2. `step.runAction` — setup sandbox, fire Claude CLI (Haiku, no tools) via generic callback script
3. `step.awaitEvent(summarizeCompleteEvent)` — wait for sandbox callback
4. `step.runMutation` — parse JSON array, save summary via `sessions.updateSummary`

**Completion handler**: `summarizeWorkflow:handleCompletion` (public mutation with Clerk auth)

**Frontend change**: `ChatPanel.tsx` — replace `fetch("/api/inngest/send")` with:

```ts
const { githubToken, convexToken } = await getWorkflowTokens(installationId);
await summarize({ id: sessionId, githubToken, convexToken });
```

**Schema**: Add `activeWorkflowId: v.optional(v.string())` to `sessions` table.

---

### Function 2: `docPrdUpload` (simple)

**Current**: `apps/web/lib/inngest/functions/doc-prd-upload.ts`
**Event**: `docs/prd-upload.parse`
**Frontend trigger**: `apps/web/app/(main)/[repo]/docs/DocsClient.tsx` line 77

**New files:**

- **`packages/backend/convex/docPrdWorkflow.ts`** — workflow + helpers

**Workflow steps:**

1. `step.runQuery` — fetch doc (with PRD content) + repo data
2. `step.runAction` — setup sandbox, fire Claude CLI (Sonnet, Read/Glob/Grep) with PRD parsing prompt
3. `step.awaitEvent(prdCompleteEvent)`
4. `step.runMutation` — parse JSON, normalize fields (description, requirements, userFlows), save to doc

**Frontend change**: `DocsClient.tsx` — replace `fetch("/api/inngest/send")` with Convex mutation call.

**Schema**: Add `activeWorkflowId: v.optional(v.string())` to `docs` table (if not already present).

---

### Function 3: `evaluateDoc` (medium — two-phase CLI)

**Current**: `apps/web/lib/inngest/functions/evaluate-doc.ts`
**Event**: `testing-arena/evaluate.doc`
**Frontend triggers**:

- `apps/web/app/(main)/[repo]/testing-arena/TestingArenaClient.tsx` line 145
- `apps/web/app/(main)/[repo]/testing-arena/[id]/page.tsx` line 305

**New files:**

- **`packages/backend/convex/evaluationWorkflow.ts`** — workflow + helpers + custom script builder

**Custom sandbox script** (two-phase):

1. Phase 1: Run Claude CLI (Sonnet, Read/Glob/Grep) for codebase exploration
2. Phase 2: Run Claude CLI (Sonnet, no tools) for evaluation JSON generation
3. Send combined result back via completion mutation

**Workflow steps:**

1. `step.runMutation` — create evaluation report, set status to "running"
2. `step.runQuery` — fetch doc requirements + repo data
3. `step.runAction` — setup sandbox, fire two-phase script
4. `step.awaitEvent(evalCompleteEvent)`
5. `step.runMutation` — parse evaluation results, save to report, clear streaming

**Frontend change**: Replace `fetch("/api/inngest/send")` with Convex mutation. The "Test All" button loops over docs calling the mutation for each.

---

### Function 4: `docInterview` (medium — conditional two-phase)

**Current**: `apps/web/lib/inngest/functions/doc-interview.ts`
**Event**: `docs/interview.question`
**Frontend trigger**: `apps/web/lib/components/docs/DocInterviewDialog.tsx` line 129

**New files:**

- **`packages/backend/convex/docInterviewWorkflow.ts`** — workflow + helpers + custom script builder

**Custom sandbox script** (conditional):

1. Run Claude CLI (Sonnet, Read/Glob/Grep) with interview prompt
2. Parse result: if question JSON → send back as result
3. If `ready: true` → run second Claude CLI pass to generate description/requirements/userFlows → send combined result

**Workflow steps:**

1. `step.runQuery` — fetch doc + repo + previous interview answers
2. `step.runMutation` — add empty assistant message for streaming
3. `step.runAction` — setup sandbox, fire conditional script
4. `step.awaitEvent(docInterviewCompleteEvent)`
5. `step.runMutation` — parse result: save question to interview history, OR save generated content to doc

**Frontend change**: `DocInterviewDialog.tsx` — replace `fetch("/api/inngest/send")` with Convex mutation.

---

### Function 5: `interviewQuestion` (medium — conditional two-phase)

**Current**: `apps/web/lib/inngest/functions/interview-question.ts`
**Event**: `project/interview.question`
**Frontend triggers**:

- `apps/web/lib/components/projects/ProjectChatTab.tsx` line 123
- `apps/web/lib/components/projects/ProjectTabs.tsx` line 73

**New files:**

- **`packages/backend/convex/projectInterviewWorkflow.ts`** — workflow + helpers + custom script builder

**Nearly identical pattern to `docInterview`** but for projects:

1. Fetches project data instead of doc data
2. Different prompt (product-minded engineer interview for feature specs)
3. On `ready: true`, generates task breakdown spec with dependencies
4. Updates project phase to "finalized" and stores `generatedSpec`

**Workflow steps:**

1. `step.runQuery` — fetch project + repo + previous answers
2. `step.runMutation` — add empty assistant message
3. `step.runAction` — setup sandbox, fire conditional script
4. `step.awaitEvent(projectInterviewCompleteEvent)`
5. `step.runMutation` — save question OR finalize spec + update phase

**Frontend change**: `ProjectChatTab.tsx` and `ProjectTabs.tsx` — replace `fetch` calls.

---

### Function 6: `generateTests` (complex — git ops + PR creation)

**Current**: `apps/web/lib/inngest/functions/generate-tests.ts`
**Event**: `docs/generate-tests.requested`
**Frontend trigger**: `apps/web/lib/components/docs/DocViewer.tsx` line 131

**New files:**

- **`packages/backend/convex/testGenWorkflow.ts`** — workflow + helpers + custom script builder

**Custom sandbox script** (complex):

1. Run Claude CLI (Sonnet, Read/Write/Edit/Bash/Glob/Grep) with test generation prompt — **15 min timeout**
2. After completion: `git add -A && git commit && git push`
3. Create PR via GitHub API (needs GitHub token in sandbox env)
4. Send result (PR URL) back via completion mutation

**Key difference**: Uses ephemeral sandbox (not reused), creates branch, commits, pushes, creates PR. GitHub token must be passed to the sandbox script for PR creation.

**Workflow steps:**

1. `step.runQuery` — fetch doc + repo, check if already completed (early exit)
2. `step.runMutation` — set `testGenStatus` to "running"
3. `step.runAction` — create ephemeral sandbox, setup branch, fire test gen script
4. `step.awaitEvent(testGenCompleteEvent)`
5. `step.runMutation` — save PR URL, set status to "completed", cleanup

**Frontend change**: `DocViewer.tsx` — replace `fetch` with Convex mutation.

---

## Inngest Cleanup

After all 6 are migrated:

**Delete files:**

- `apps/web/lib/inngest/functions/evaluate-doc.ts`
- `apps/web/lib/inngest/functions/interview-question.ts`
- `apps/web/lib/inngest/functions/summarize-session.ts`
- `apps/web/lib/inngest/functions/doc-interview.ts`
- `apps/web/lib/inngest/functions/doc-prd-upload.ts`
- `apps/web/lib/inngest/functions/generate-tests.ts`

**Modify:**

- `apps/web/lib/inngest/index.ts` — remove 6 exports
- `apps/web/app/api/inngest/route.ts` — remove 6 imports + registrations

---

## Files Summary

| File                                                  | Action | Purpose                                                    |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `apps/web/app/(main)/[repo]/actions.ts`               | Create | Shared `getWorkflowTokens` server action                   |
| `apps/web/app/(main)/[repo]/design/actions.ts`        | Modify | Re-export from parent                                      |
| `packages/backend/convex/daytona.ts`                  | Modify | Add `launchScript`, `setupBranch`, `buildCallbackScript`   |
| `packages/backend/convex/summarizeWorkflow.ts`        | Create | Session summary workflow                                   |
| `packages/backend/convex/docPrdWorkflow.ts`           | Create | PRD upload parsing workflow                                |
| `packages/backend/convex/evaluationWorkflow.ts`       | Create | Doc evaluation workflow                                    |
| `packages/backend/convex/docInterviewWorkflow.ts`     | Create | Doc interview workflow                                     |
| `packages/backend/convex/projectInterviewWorkflow.ts` | Create | Project interview workflow                                 |
| `packages/backend/convex/testGenWorkflow.ts`          | Create | Test generation workflow                                   |
| `packages/backend/convex/schema.ts`                   | Modify | Add `activeWorkflowId` to sessions/docs tables             |
| `packages/backend/convex/sessions.ts`                 | Modify | Add `summarize` mutation                                   |
| `packages/backend/convex/docs.ts`                     | Modify | Add interview/prd/testGen/evaluate mutations               |
| `packages/backend/convex/evaluationReports.ts`        | Modify | Add execute mutation                                       |
| `packages/backend/convex/projects.ts`                 | Modify | Add interview mutation                                     |
| 6 frontend files                                      | Modify | Replace `fetch("/api/inngest/send")` with Convex mutations |
| 6 Inngest function files                              | Delete | Remove migrated functions                                  |
| `apps/web/lib/inngest/index.ts`                       | Modify | Remove 6 exports                                           |
| `apps/web/app/api/inngest/route.ts`                   | Modify | Remove 6 registrations                                     |

---

## Execution Order

Migrate in order of complexity (simplest first):

1. `summarizeSession` — single CLI run, no tools, Haiku model
2. `docPrdUpload` — single CLI run, read-only tools
3. `evaluateDoc` — two-phase CLI, read-only tools
4. `docInterview` — conditional two-phase, read-only tools
5. `interviewQuestion` — conditional two-phase (same pattern as docInterview)
6. `generateTests` — complex: write tools, git ops, PR creation

---

## Verification

For each migrated function:

1. Trigger from the frontend → verify workflow starts
2. Check streaming activity appears in real-time
3. Verify final result is saved correctly
4. Test error handling (kill sandbox mid-execution)
5. Remove the Inngest function and verify no regressions
