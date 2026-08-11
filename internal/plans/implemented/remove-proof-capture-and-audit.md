# Remove the proof capture and audit subsystems entirely

Status: DONE (2026-08-11). Shipped to `main` and deployed to dev
(`good-mule-506`) and prod (`sensible-woodpecker-357`). Both deployments ran the
data migration before the schema drop.

Commits, in order:

| Commit | What |
| --- | --- |
| `24aad58c` | Ship 1 — all code removed, migration definitions added, schema intact (105 files, +381 / −5546) |
| `b6e97ff1` | Two migration fixes found while running dev (see "Migration gotchas") |
| `e2c18147` | Ship 2 — schema drop and migration cleanup (9 files, +10 / −367) |
| `4d1c5c78` | Changelog entry |

## Why

Proof capture and audits were built as pipeline UI: workflow steps, streaming
state, timeline items, per-run toggles and repo model pickers, all of which had
to stay correct across quick tasks, project tasks, sessions and sandbox chat.
Four surfaces multiplied by two features meant every change to either one had to
be re-verified in eight places. The features earned their keep when the only way
to ask Eva for a recording or a review was a button in the platform UI.

That stopped being true when the system skills shipped. `_systemSkills/` now
serves `eva-capture` and `eva-audit`, installed per repo (`repoSystemSkills`
table, Settings → Skills), materialised as stub `SKILL.md` files at launch and
hydrated over the `get_skill` MCP tool. A user who wants proof or an audit asks
in the sandbox chat and the agent invokes the skill. The platform pipeline was
duplication of a capability that already existed in a cheaper form.

The user's framing: both were "initially done to make a fancy UI for and make it
easier for users to interact with AI, but I think it has become a burden to
maintain and get right now".

## What existed before

### Proof capture

- **Workflow.** `_taskWorkflow/workflowDefinition.ts` ran a proof block on both
  the first-run and retry paths: `prepareProofSandbox` →
  `awaitEvent(proofCompleteEvent)` → `waitForProofMedia`. It sat after the push
  and before PR creation, so a task could not open its PR until proof finished
  or timed out.
- **A second agent.** `_sandbox_runtime/proof.ts` (171 lines) launched a
  dedicated proof-capture agent inside the task sandbox, on the repo's
  `proofModel`, with a prompt built by `buildProofPrompt` /
  `buildProofRetryPrompt` in `_taskWorkflow/prompts.ts` (205 lines of prompt
  builders in total, shared with audit).
  `uiImplementationPrompt.ts` added `buildUiProofCaptureHint` for UI tasks.
- **Storage.** The `taskProof` table held one row per artefact: `taskId`,
  optional `storageId` (`_storage`), `fileName`, `message`, `runId`,
  `createdAt`. `taskProof.ts` (158 lines) exposed `save`, `saveMessage`,
  `generateUploadUrl`, `listByTask` and their deploy-key `*Internal` twins.
  Text-only rows recorded "no UI changes" outcomes.
- **Callback side.** `TASK_PROOF_CAPTURE_ENABLED` told the sandbox daemon to
  persist harvested media as `taskProof` rows rather than chat attachments;
  `persistTaskProofIfNeeded`, `saveProofFailureMessageIfNeeded`,
  `PROOF_NO_MEDIA_MESSAGE` and `runtime/proofMedia.ts` implemented it. Media
  delivery was ordered proof-first, completion-second, so the PR body could
  quote the artefacts.
- **PR body.** `prBody.ts` carried a `ProofItem` type and emitted a `## Proof`
  section listing every artefact.
- **UI.** `ProofTimelineItem.tsx` (272 lines) rendered artefacts in the task
  activity timeline. `ScreenshotsToggle.tsx` set the tri-state per task.
- **Flags.** `agentTasks.screenshotsVideosEnabled` and
  `projects.screenshotsVideosEnabled` (tri-state: undefined inherits,
  true forces on, false forces off), `agentRuns.screenshotsVideosEnabled`
  (per-run override from the request-changes composer),
  `sessions.captureProofEnabled`, `agentTasks.chatCaptureProofEnabled`,
  `projects.chatCaptureProofEnabled` (sandbox-chat switches),
  `githubRepos.proofModel`.

### Audits

- **Storage.** The `audits` table held `entityId` (a task, session or project
  id), `runId`, `status`, `sections[]` (each a named group of pass/fail
  requirement results), `summary`, `error`, `fixStatus` and three timestamps.
  The `auditCategories` table held per-repo categories — `name`, `description`,
  `enabled`, plus `appId` / `disabledForAppIds` for per-app scoping.
- **Workflow.** `_taskWorkflow/audit.ts` (236 lines) launched the audit after a
  successful run and awaited `auditCompleteEvent`; `auditParser.ts` (84 lines)
  turned the agent's report into `sections`; `prAudit.ts` (111 lines) appended
  an audit section to the pull request and preserved it across PR refreshes via
  `AUDIT_SECTION_REGEX`.
- **A third agent.** `_sandbox_runtime/audit.ts` (378 lines) ran the reviewer in
  the sandbox on `auditReviewModel`, streaming into
  `task-audit-run-<runId>` / `audit-<entityId>` keys in `streamingActivity`.
- **Run Fixes.** `auditFixWorkflow.ts` plus `_audits/fixes.ts` re-launched the
  agent on `auditFixModel` against the failures a user selected, then awaited
  `auditFixCompleteEvent`.
- **Other surfaces.** `_audits/sessionAudit.ts` (208 lines) audited session
  turns and drove the audit stage of the session review modal;
  `_audits/chatAudit.ts` (190 lines) audited sandbox-chat turns;
  `_audits/queries.ts` (113 lines) served all of it.
- **UI.** `AuditTimelineItem.tsx` (151), `AuditResults.tsx` (291),
  Settings → Audits (`audits.tsx`, `AuditsClient.tsx`, `AddCategoryForm.tsx`),
  `AuditToggle.tsx`, `SessionOptionsMenu.tsx` (76) and `ChatOptionsSubmenu.tsx`
  (137) for the per-chat switches, and the audit stage inside
  `SessionReviewModal.tsx`.
- **Flags.** `agentTasks.runAuditEnabled`, `projects.runAuditEnabled`,
  `agentRuns.runAuditEnabled`, `sessions.runAuditEnabled`,
  `agentTasks.chatRunAuditEnabled`, `projects.chatRunAuditEnabled`,
  `githubRepos.auditReviewModel`, `githubRepos.auditFixModel`.
- **Supporting shape.** `activityLogTypeValidator` was
  `run | audit | fix | proof`; `logs` rows used `entityType` values `taskProof`,
  `taskAudit` and `sessionAudit`; `workflowWatchdog.ts` had `handleStaleAudit`.

## Decisions taken during planning

| Question | Decision |
| --- | --- |
| Scope | Whole subsystem — task runs (quick and project), sessions, sandbox chat, project defaults, repo settings, schema tables, Run Fixes |
| Landing page marketing | Clean up in the same change, not later |
| `auditCategories` | Drop the table, the module and Settings → Audits; `eva-audit` falls back to its built-in `DEFAULT_CATEGORIES` |
| Production data | In scope, using the `@convex-dev/migrations` component, with a user confirmation gate before the destructive run |

## What stayed, and why

The always-on chat media pipeline is **not** part of proof capture and had to
survive intact, because `eva-capture` depends on it:

- `uploadAndAttachSandboxMedia` in `callback-src/runtime/completion.ts`. This is
  contract-tested on the literal declaration —
  `tests/mediaHarvestContract.test.ts` searches for
  `async function uploadAndAttachSandboxMedia(` in both the source and the
  generated bundle, then requires sha256 dedupe before `uploadMediaFile(` inside
  the body. The name, the `async function` form and the dedupe order are all
  load-bearing.
- `screenshots.ts` (`attachMedia`, `generateUploadUrl`),
  `messageFields.mediaStorageIds`, `_messages/media.ts`.
- The "## Shared Browser" and "## Recordings / screenshots in chat (required)"
  sections of `_sessions/prompts.ts`, which `eva-capture` mirrors.
- The git-add exclusions `':!screenshots/' ':!recordings/'` in
  `_taskWorkflow/prompts.ts` and `uiImplementationPrompt.ts` — chat turns share
  the sandbox and still capture.
- The whole `_systemSkills/` and `repoSystemSkills.ts` layer, plus
  Settings → Skills.

Validators whose names suggest audits but belong to the testing arena also
stayed: `auditSeverityValidator`, `evaluationStatusValidator`,
`evalFixStatusValidator`, and `evaluationReportFields` in `tableFields.ts`.

Grep note for anyone repeating this exercise: the flags
`screenshotsVideosEnabled` and `captureProofEnabled` contain neither "proof" nor
"audit", so a keyword sweep alone under-reports. Sweep by symbol name as well.

## Ship 1 — remove the code, keep the schema

Convex cannot drop a field while documents still carry it, and clearing a field
with `{field: undefined}` only works while the schema still marks it
`v.optional`. That forces two deploys with the data migration between them.

**Deleted outright.** `taskProof.ts`, `audits.ts`, `auditCategories.ts`,
`auditFixWorkflow.ts`, the four `_audits/` modules,
`_taskWorkflow/{audit,auditParser,prAudit}.ts`,
`_sandbox_runtime/{proof,audit}.ts`, and on the frontend
`{Proof,Audit}TimelineItem.tsx`, `AuditResults.tsx`, `ScreenshotsToggle.tsx`,
`AuditToggle.tsx`, `ChatOptionsSubmenu.tsx`, `SessionOptionsMenu.tsx` and the
whole Settings → Audits route.

**Edited.** The workflow definition lost both blocks and their events; the
public mutations lost `handleProofCompletion`, `handleAuditCompletion`,
`handleAuditFixCompletion` and `getLatestRunningAudit`; `queries.ts` lost proof
and audit resolution from `getTaskData`; the watchdogs lost their stale-audit
handling; `prBody.ts` lost the Proof section; the four run-level flags came out
of every mutation, prompt builder and optimistic payload across tasks,
projects, sessions and both chat workflows.

**Callback runtime.** `persistTaskProofIfNeeded` became `attachChatMediaIfAny`
(the attach branch only), the harvest gate became `if (RUN_ID) return;` so task
runs skip media and chat turns always scan, delivery became unconditionally
completion-first, and `runtime/proofMedia.ts` became `runtime/sandboxMedia.ts`
with `mediaCandidateRoots` / `mediaSearchDirs`. The bundle was regenerated with
`pnpm run build:callback`.

**Skill decoupling.** `eva-audit` no longer hydrates per-repo categories:
`SystemSkillCategory` and the `categories` field left `registry.ts`,
`buildHydration` in `repoSystemSkills.ts` dropped its `auditCategories` query
and the `appId` filter that existed only to scope categories, and `evaAudit.ts`
always renders its four `DEFAULT_CATEGORIES` (Correctness, Security,
Performance, Code quality).

**Landing page.** The Proof and Audit tabs left the task detail mock, and
`landingContent.ts`, `VerifyPreviews.tsx`, `WorkspacePreviews.tsx`,
`LandingHero.tsx` and `LandingCompact.tsx` lost their audit and proof copy. The
Verify section now reads "Review before merge."

**Tests.** `proofPrompt.test.ts` and `taskWorkflowAudit.test.ts` deleted;
`proofMedia.test.ts` renamed to `sandboxMedia.test.ts`; the category tests in
`systemSkillRegistry.test.ts` collapsed into one asserting the four defaults;
`agentBrowserRecordingPrompts.test.ts`, `prBody.test.ts` and
`uiTaskPrompt.test.ts` trimmed.

## The migration

Built on the `@convex-dev/migrations` component (v0.3.5), already wired through
`convex.config.ts` and `convex/dataMigrations.ts`, rather than the hand-rolled
paginated `internalMutation` pattern in `_migrations/`. The component
checkpoints after every batch, resumes from the last cursor on failure, refuses
to double-run, and supports `dryRun`.

Thirteen definitions ran as one serial runner, `removeProofAndAudit`:

| # | Step | Table | Action |
| --- | --- | --- | --- |
| 1 | `TaskProof` | `taskProof` | Delete the blob then the row, `batchSize: 25` |
| 2 | `Audits` | `audits` | Delete every row |
| 3 | `Categories` | `auditCategories` | Delete every row |
| 4 | `TaskFields` | `agentTasks` | Clear 4 fields (drafts live in this table too) |
| 5 | `RunFields` | `agentRuns` | Clear 2 fields |
| 6 | `ProjectFields` | `projects` | Clear 4 fields |
| 7 | `SessionFields` | `sessions` | Clear 2 fields |
| 8 | `RepoModelFields` | `githubRepos` | Clear 3 model fields |
| 9 | `ActivityLogs` | `agentRunActivityLogs` | Delete `type` ∈ {proof, audit, fix} |
| 10–12 | `TaskProofLogs` / `TaskAuditLogs` / `SessionAuditLogs` | `logs` | Delete by `entityType`, scoped with `customRange` over `by_entity_type` |
| 13 | `Streaming` | `streamingActivity` | Delete `entityId` starting `task-audit-run-` or `audit-` |

The `logs` table is large, so each entity type got its own index-scoped
migration rather than one full-table scan. Steps 9 and 13 scan, because neither
table has a usable index for the predicate; both are small enough that this is
cheap.

### Migration gotchas (both fixed in `b6e97ff1`)

1. **Dangling storage ids.** Some `taskProof` rows carried a `storageId` whose
   blob was already gone — repo deletion used to clear storage without clearing
   the row — and `ctx.storage.delete` throws on a missing id, which failed the
   first dev run. The fix is a `ctx.db.system.get(doc.storageId)` check, not a
   blanket try/catch, so a genuine failure still surfaces.
2. **`customRange` needs the schema.** The component throws "You must provide
   your schema to use a custom range" unless the `Migrations` constructor gets a
   `schema` option. Passing it is not enough on its own: `Migrations` takes a
   second type argument that defaults to `void`, and `customRange` resolves its
   index field types through it, so `new Migrations<DataModel>(...)` rejects
   both the option and the index literals. It must be
   `new Migrations<DataModel, typeof schema>(...)`.

## Deploy and migrate

Dev first, then prod, both before Ship 2 landed anywhere — Ship 2 deletes the
migration definitions, so a deployment that has not migrated has no way to catch
up short of a revert.

Prod was checked for in-flight `agentRuns` first (the newest had finished 78
minutes earlier) and deployed in that quiet window. Counts were dry-run and
confirmed with the user before the destructive run, because it deletes stored
media irreversibly.

Rows **visited** per step, as reported by `lib:getStatus` (dev / prod). Steps 4
to 8, 9 and 13 scan or range over the whole table, so the count is rows the
migration walked, not rows it changed or deleted. Of the 566 prod `taskProof`
rows, 288 had a live blob that was deleted from storage.

| Step | Dev | Prod |
| --- | --- | --- |
| TaskProof | 566 | 566 |
| Audits | 139 | 139 |
| Categories | 5 | 5 |
| TaskFields | 808 | 816 |
| RunFields | 1183 | 1188 |
| ProjectFields | 13 | 13 |
| SessionFields | 173 | 176 |
| RepoModelFields | 17 | 17 |
| ActivityLogs | 1020 | 1025 |
| TaskProofLogs | 37 | 37 |
| TaskAuditLogs | 59 | 59 |
| SessionAuditLogs | 1 | 1 |
| Streaming | 622 | 635 |

All thirteen steps reported `success` on both deployments, and `taskProof`,
`audits` and `auditCategories` were confirmed empty in both dashboards.

## Ship 2 — drop the schema

- `schema.ts`: the `taskProof`, `audits` and `auditCategories` tables, and the
  now-unused validator imports. Five indexes were dropped on each deployment.
- `_validators/tableFields.ts`: 4 fields from `agentTaskFields`, 2 from
  `agentRunFields`, 2 from `sessionFields`, 4 from `projectFields`, 3 from
  `githubRepoFields`.
- `_validators/shapes.ts`: `auditSectionValidator` and `auditFailureValidator`.
- `_validators/enums.ts`: `activityLogTypeValidator` narrowed to
  `v.literal("run")`.
- `_migrations/`: the `taskProof` and both `audits` blocks in `deleteRepos.ts`,
  `"auditCategories"` from its `flatTables` list, the stale-audit patch loop in
  `cleanup.ts`, and `"taskAudit"` from `logProjectIds.ts`.
- `dataMigrations.ts`: the thirteen definitions and the runner. These had to go
  — `{screenshotsVideosEnabled: undefined}` stops typechecking the moment the
  field leaves `tableFields.ts`. The component keeps its completion records in
  its own tables, so deleting the definitions resurrects nothing.

## Verification

- `npx convex codegen --typecheck enable` clean after each ship.
- `tsc --noEmit` clean for `convex/` and for `apps/web`. The pre-existing
  errors in `scripts/vercel-sandbox-spike/*.mjs` are unrelated and untouched.
- 654 backend tests pass across 96 files, including every contract test that
  was at risk: `mediaHarvestContract`, `convexModuleCycleContract`,
  `streamingDestinationContract`, `sessionPublishContract`,
  `startupMarkerContract`, `queryDeterminismContract`, `prewarmNeverResurrects`.
- Generated callback bundle contains no `taskProof`, `TASK_PROOF` or
  `PROOF_NO_MEDIA`, and still contains `uploadAndAttachSandboxMedia`.
- Case-insensitive `proof|audit` sweep plus a symbol sweep over
  `packages/backend/convex`, `packages/backend/callback-src`, `packages/shared`
  and `apps/web/src` returns only the `eva-capture` and `eva-audit` skill
  content, which is the intended replacement.

## Consequences accepted

- **Repos with custom audit categories lost them.** Five category rows were
  deleted across all repos. Every `eva-audit` invoke now uses the four built-in
  defaults. Confirmed with the user before the run.
- **All proof media and audit history is gone**, including 288 stored blobs.
  Irreversible by design; an export was offered and declined.
- **In-flight workflows at the prod deploy.** `@convex-dev/workflow` replays a
  positional step journal, so a run parked inside or past a proof or audit block
  would have mismatched the journal or stalled, and the two-hour watchdog would
  have errored it and reset the task to todo. Bounded to one failed run per
  affected task; avoided in practice by deploying into a quiet window.
- **Pre-deploy sandboxes** calling the deleted mutations get function-not-found
  after retries. Chat turns are unaffected, and warm daemons self-replace on a
  `CALLBACK_SCRIPT_FP` mismatch.

## Follow-up

Skill smoke test on dev, not yet run: in a sandbox session with `eva-audit`
installed, ask "audit this branch" and confirm the agent fetches the skill via
`get_skill` and reports the four default categories; then ask "record a
walkthrough" and confirm `eva-capture` runs and the media attaches to the chat
message.
