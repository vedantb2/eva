# Generate Tests from Docs — PR Creation Feature

## Context

The `/docs` page stores feature documentation with `requirements` (code-level) and `userFlows` (UI-level). There's an existing **evaluation** system (`evaluate-doc.ts`) that reads the codebase to check if requirements are met — but it never writes code. This feature adds a "Generate Tests" button that creates actual test files in a new branch and opens a PR. If a PR already exists for the doc, the button shows a link instead.

## Files to Modify/Create

| File                                               | Action                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/backend/convex/schema.ts`                | Add `testGenStatus`, `testPrUrl` to `docs` table                                      |
| `packages/backend/convex/docs.ts`                  | Add `startTestGen`, `completeTestGen`, `failTestGen` mutations; update `docValidator` |
| `apps/web/lib/inngest/functions/generate-tests.ts` | **New** — Inngest function that sandboxes Claude to write tests and create a PR       |
| `apps/web/lib/inngest/index.ts`                    | Export `generateTests`                                                                |
| `apps/web/app/api/inngest/route.ts`                | Register `generateTests` in serve array                                               |
| `apps/web/lib/components/docs/DocViewer.tsx`       | Add "Generate Tests" / "View Tests PR" button                                         |

## Step 1: Schema — Add fields to `docs` table

**`packages/backend/convex/schema.ts`** (line ~224, before `createdAt`):

```ts
testGenStatus: v.optional(evaluationStatusValidator),  // reuse existing validator
testPrUrl: v.optional(v.string()),
```

## Step 2: Convex mutations — `docs.ts`

**Update `docValidator`** (line ~29) — add the two new optional fields so `get`/`list` queries return them.

**Add 3 mutations:**

- `startTestGen({ id })` — patches `testGenStatus: "running"`, clears `testPrUrl`
- `completeTestGen({ id, prUrl })` — patches `testGenStatus: "completed"`, sets `testPrUrl`
- `failTestGen({ id })` — patches `testGenStatus: "error"`

Follow the exact pattern of existing mutations (auth check, doc existence check, `ctx.db.patch`).

## Step 3: Inngest function — `generate-tests.ts`

Event: `docs/generate-tests.requested`

Follows `evaluate-doc.ts` pattern exactly, with these differences:

1. **`fetch-data`** — get doc + repo
2. **`update-status`** — call `api.docs.startTestGen`
3. **`setup-sandbox`** — `createSandbox` → `syncRepo` → `setupBranch("tests/doc-{slug}")`
4. **`generate-tests`** — `runClaudeCLIStreaming` with **write tools** (`Read, Write, Edit, Bash, Glob, Grep`) and a prompt that instructs Claude to:
   - Read CLAUDE.md / explore the codebase for testing framework and patterns
   - Find source code implementing the feature
   - Generate test files covering each requirement and user flow
   - `git add -A && git commit -m "test: add tests for {title}" && git push -u origin {branch}`
5. **`create-pr`** — `POST /repos/{owner}/{repo}/pulls` (same pattern as `session-execute.ts` line 87-103)
6. **`complete`** — call `api.docs.completeTestGen` with the PR URL, cleanup sandbox

**`onFailure`** — calls `api.docs.failTestGen`

### Prompt (key parts)

```
You are a test engineer. Generate tests for the feature described below.

## Feature: {title}
{description}

## Requirements to test:
1. {requirement1}
2. {requirement2}
...

## User Flows:
### {flowName}
1. {step1}
2. {step2}
...

## Steps:
1. Read CLAUDE.md for tech stack and testing conventions
2. Explore the codebase for existing test patterns and frameworks
3. Find the source code implementing this feature
4. Generate test files covering each requirement and user flow
5. Place tests alongside existing tests or in the appropriate directory
6. Match the existing testing framework and patterns
7. git add -A && git commit -m "test: add tests for {title}"
8. git push -u origin {branchName}

## Rules:
- Only generate test files, do NOT modify source code
- Cover each requirement with at least one test case
- Do NOT run the tests
```

## Step 4: Register function

**`apps/web/lib/inngest/index.ts`** — add export line:

```ts
export { generateTests } from "./functions/generate-tests";
```

**`apps/web/app/api/inngest/route.ts`** — add to imports and `functions` array.

## Step 5: UI — DocViewer button

**`apps/web/lib/components/docs/DocViewer.tsx`** — add button in the header bar (line ~135, after "Interview Me"):

**Logic:**

- `testGenStatus === "completed" && testPrUrl` → Show "View Tests PR" link button (opens in new tab)
- `testGenStatus === "running"` → Show "Generating..." disabled button with spinner
- Otherwise → Show "Generate Tests" button

**Handler:**

```ts
const handleGenerateTests = async () => {
  await fetch("/api/inngest/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "docs/generate-tests.requested",
      data: { docId: doc._id, repoId: doc.repoId },
    }),
  });
};
```

New imports: `IconTestPipe`, `IconExternalLink` from `@tabler/icons-react`, `Spinner` from `@conductor/ui`.

## Verification

1. Add requirements to a doc on the docs page
2. Click "Generate Tests" — button should switch to "Generating..."
3. Once complete, button should show "View Tests PR" linking to the GitHub PR
4. The PR should contain test files matching the codebase's testing framework
5. Clicking "Generate Tests" on a doc that already has a completed PR shows the link instead
6. If generation fails, button resets to "Generate Tests" (retry-able)
7. Run `npx tsc` in `apps/web` to verify no type errors
