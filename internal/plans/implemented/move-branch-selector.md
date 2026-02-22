# Plan: Move Branch Selector from Sidebar to Inline Contexts

## Context

The sidebar has a `BranchSelector` component (`apps/web/lib/components/sidebar/BranchSelector.tsx`) that stores the selected branch in `localStorage` — but **nothing reads it**. The `useBaseBranch` hook is never imported outside the component itself. It's a dead feature.

Instead of a global sidebar selector, the branch should be chosen **per-context**: when executing a task, creating a project, or running tests. The backend already accepts optional `branchName` params everywhere — it just never receives them from the frontend.

---

## Changes

### 1. Extract `useBranches` hook

**New file:** `apps/web/lib/hooks/useBranches.ts`

Extract the SWR branch-fetching logic from `BranchSelector.tsx` into a reusable hook:

```ts
function useBranches(owner: string, repoName: string, installationId: number) → { branches, isLoading, refresh }
```

This hook fetches from `/api/github/branches` with SWR (same as today). Returns `Branch[]`, loading state, and a refresh function.

### 2. Create `BranchSelect` inline component

**New file:** `apps/web/lib/components/BranchSelect.tsx`

A controlled select component for choosing a branch. Props: `value`, `onValueChange`, optional `className`. Internally uses `useBranches` + `useRepo()` context to get `owner`, `repoName`, `installationId`. Uses the same `Select/SelectTrigger/SelectContent/SelectItem` primitives from `@conductor/ui` that are already used throughout the modals.

Default value: `"main"`.

### 3. Task modal — standalone tasks only

**File:** `apps/web/lib/components/tasks/TaskDetailModal.tsx`

- Add `baseBranch` state (default `"main"`)
- Render `<BranchSelect>` near the "Run Eva" button, visible only when:
  - `task.projectId` is undefined (standalone task)
  - `status === "todo"` (hasn't been executed yet)
- Pass `baseBranch` through `triggerExecution` → backend

**File:** `packages/backend/convex/taskWorkflow.ts` — `triggerExecution` mutation

- Add `baseBranch: v.optional(v.string())` to args
- Thread it through to `setupAndExecute`

**File:** `packages/backend/convex/daytona.ts` — `setupAndExecute`

- Add `baseBranch: v.optional(v.string())` to args
- Before calling `setupBranch(branchName)` (which creates the working branch), if `baseBranch` is set:
  ```
  git fetch origin {baseBranch} && git checkout {baseBranch} && git pull origin {baseBranch}
  ```
  This moves HEAD to the base branch, so the subsequent `git checkout -B {workingBranch}` creates the working branch from the correct base.

### 4. New project modal — at creation time

**File:** `apps/web/lib/components/projects/NewProjectModal.tsx`

- Add `baseBranch` state (default `"main"`)
- Render `<BranchSelect>` in the form, below the description textarea
- Pass `baseBranch` to `api.projects.create`

**File:** `packages/backend/convex/projects.ts` — `create` mutation

- Add `baseBranch: v.optional(v.string())` to args
- Store it on the project document (the `branchName` field or a new `baseBranch` field)
- When `startDevelopment` runs, use this as the base for the generated working branch

### 5. Testing arena — header branch selector via nuqs

**File:** `apps/web/lib/search-params.ts`

- Add `branchParser` for nuqs: `parseAsString.withDefault("main")`

**File:** `apps/web/app/(main)/[repo]/testing-arena/TestingArenaClient.tsx`

- Add `useQueryState("branch", branchParser)` for URL-persisted branch state
- Render `<BranchSelect>` in the header area (next to the "Test All" button trigger)
- Pass `branchName` to `startEvaluation` in `handleTestAll`

**File:** `apps/web/app/(main)/[repo]/testing-arena/[id]/page.tsx`

- Read `useQueryState("branch", branchParser)` (same URL state as parent)
- Pass `branchName` to `startEvaluation` in `handleRunTest`

**File:** `packages/backend/convex/evaluationWorkflow.ts` — `startEvaluation` mutation

- Add `branchName: v.optional(v.string())` to args
- Thread it to the evaluation workflow → `setupAndExecute` as `baseBranch`

**File:** `packages/backend/convex/daytona.ts` — `setupAndExecute`

- Already handled by the `baseBranch` logic from step 3 (evaluations are ephemeral — they checkout the branch to read code, no working branch created)

### 6. Remove sidebar branch selector

**File:** `apps/web/lib/components/Sidebar.tsx`

- Remove `BranchSelector` import and rendering (lines 525-531)

**File:** `apps/web/lib/components/sidebar/BranchSelector.tsx`

- Delete this file entirely

---

## Files to modify (summary)

| File                                                              | Action                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/web/lib/hooks/useBranches.ts`                               | **Create** — extracted hook                                     |
| `apps/web/lib/components/BranchSelect.tsx`                        | **Create** — inline select component                            |
| `apps/web/lib/components/tasks/TaskDetailModal.tsx`               | **Edit** — add branch select for standalone tasks               |
| `apps/web/lib/components/projects/NewProjectModal.tsx`            | **Edit** — add branch select at creation                        |
| `apps/web/app/(main)/[repo]/testing-arena/TestingArenaClient.tsx` | **Edit** — add header branch select + pass to startEvaluation   |
| `apps/web/app/(main)/[repo]/testing-arena/[id]/page.tsx`          | **Edit** — read branch from URL state + pass to startEvaluation |
| `apps/web/lib/search-params.ts`                                   | **Edit** — add `branchParser`                                   |
| `packages/backend/convex/daytona.ts`                              | **Edit** — add `baseBranch` param to `setupAndExecute`          |
| `packages/backend/convex/taskWorkflow.ts`                         | **Edit** — thread `baseBranch` through `triggerExecution`       |
| `packages/backend/convex/evaluationWorkflow.ts`                   | **Edit** — add `branchName` to `startEvaluation` and workflow   |
| `packages/backend/convex/projects.ts`                             | **Edit** — accept `baseBranch` in `create` mutation             |
| `apps/web/lib/components/Sidebar.tsx`                             | **Edit** — remove BranchSelector                                |
| `apps/web/lib/components/sidebar/BranchSelector.tsx`              | **Delete**                                                      |

---

## Verification

1. `npx tsc` from `apps/web/` — no type errors
2. Open a standalone task modal → branch selector visible → run Eva → confirm sandbox checks out selected base branch
3. Open a project-linked task modal → no branch selector visible (inherits project branch)
4. Create a new project → branch selector in form → verify project stores `baseBranch`
5. Testing arena → branch selector in header → run test on a doc → confirm evaluation uses selected branch
6. Testing arena → "Test All" → confirm all evaluations use the header branch
7. Sidebar → confirm branch selector is gone
