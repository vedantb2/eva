# Persistent Quick-Task Sandboxes (mirror sessions)

## Context

Quick-task sandboxes are ephemeral today: when the agent finishes, `taskExecutionWorkflow` calls `internal.daytona.deleteSandbox`. When a reviewer later clicks **Start Sandbox** in code/business review, a fresh sandbox is provisioned from the branch. Code is preserved (git push), but in-sandbox state — Convex deployment data, Supabase rows, seeded fixtures, generated artifacts — is lost. Same problem hits the change-request flow (`mode: "resolve_conflicts"`): a brand-new sandbox spins up, agent re-bootstraps from scratch.

Sessions already solve this. They `stopSandbox` on close, keep `session.sandboxId`, and resume via `tryReuseSandbox` — Daytona pauses the whole filesystem (DBs included), and platform auto-archives after 7 days idle. We mirror that for `agentTasks`.

## Schema changes (`packages/backend/convex/validators.ts`)

`agentTasksFields`:

- Add `sandboxId: v.optional(v.string())` — canonical, shared across run / preview / resolve_conflicts.
- Add `reviewTaskSandboxStatus: v.optional(v.union(v.literal("starting"), v.literal("active"), v.literal("closed")))` — UI state for the reviewer-facing Start/Stop button.
- Keep legacy `previewSandboxId` and `previewSandboxStatus` as optional during migration window (chicken-egg rule).

`agentRunsFields`: leave `sandboxId` as-is — per-run history lookup (logs/traces).

## Mutation changes

### `_agentTasks/sandbox.ts`

`startTaskSandbox`:

- Read `task.sandboxId` (was `task.previewSandboxId`).
- Patch `reviewTaskSandboxStatus: "starting"`.
- Workflow start unchanged (already passes `existingSandboxId`).

`stopTaskSandbox` (currently a no-op — must actually stop):

- If `task.sandboxId`, schedule `internal.daytona.stopSandbox` via `ctx.scheduler.runAfter(0, …)` — same as `_sessions/sandbox.ts:stopSandbox`.
- Patch `reviewTaskSandboxStatus: "closed"`. Keep `sandboxId` for resume.

`taskSandboxReady` / `taskSandboxError`:

- Write to `sandboxId` + `reviewTaskSandboxStatus` (rename only).

### `_taskWorkflow/runLifecycle.ts`

`saveSandboxId` already patches `agentRuns.sandboxId`. Extend it (or add sibling mutation `saveTaskSandboxId`) so the workflow also patches `agentTasks.sandboxId` for non-project tasks. Project tasks already get this via `updateProjectSandbox` → `projects.sandboxId`; they don't need task-level mirroring.

Cleanest: add one new internal mutation `saveTaskSandboxId(taskId, sandboxId)` and call it from the workflow alongside `saveSandboxId`. Keeps separation of concerns.

## Workflow changes

### `_taskWorkflow/workflowDefinition.ts`

**Sandbox reuse on subsequent runs (change-requests):**

- `_taskWorkflow/queries.ts:getTaskData` already returns `projectSandboxId` for project tasks. Add `taskSandboxId: v.optional(v.string())` populated from `task.sandboxId` for non-project tasks.
- Line 60-72: change `existingSandboxId: data.projectSandboxId` → `existingSandboxId: data.projectSandboxId ?? data.taskSandboxId`.
- Also flip `ephemeral: !args.projectId` → `ephemeral: !args.projectId && !data.taskSandboxId` so subsequent runs of a quick task don't get auto-cleaned.
- After provisioning: call new `saveTaskSandboxId` for non-project tasks (mirror of `updateProjectSandbox`).

**Stop instead of delete on completion:**

- Line 335-341 (success path): `internal.daytona.deleteSandbox` → `internal.daytona.stopSandbox`. Drop `sandboxDeleted` flag rename; semantics same (don't double-stop in catch).
- Line 402-414 (catch path): same change (`deleteSandbox` → `stopSandbox`).
- Patch `agentTasks.reviewTaskSandboxStatus: "closed"` after stop, so UI reflects "stopped, click to resume".

### `_taskWorkflow/recovery.ts`

Line 126: `cleanUpStaleRun` deletes the sandbox for non-project tasks. **Keep delete** — stale runs mean the workflow died mid-execution; sandbox state is suspect, cleanest to wipe. User can re-run from scratch. (Document this rationale in code comment.)

Also clear `task.sandboxId` + `reviewTaskSandboxStatus` in `cleanUpStaleRun` so the resume button doesn't point at a deleted sandbox.

## UI updates

`apps/web/src/lib/components/tasks/useTaskDetail.tsx` lines 133-134:

- `task?.previewSandboxStatus` → `task?.reviewTaskSandboxStatus` (both `isSandboxActive` and `isSandboxStartingFromStatus`).

Search-and-replace all consumers of `previewSandboxId` / `previewSandboxStatus` in `apps/web/src/`. Both fields go from "preview-only" to "the canonical task sandbox" — naming change should follow.

## Migration

New file `packages/backend/convex/migrations/copyTaskSandboxFields.ts`:

- Iterate `agentTasks`, copy `previewSandboxId` → `sandboxId`, `previewSandboxStatus` → `reviewTaskSandboxStatus`.
- Run via `npx convex run migrations:copyTaskSandboxFields`.
- After migration succeeds, drop `previewSandboxId` / `previewSandboxStatus` from validators and the migration file.

Migration order (chicken-egg):

1. Add new fields alongside old (both optional). Deploy.
2. Run migration.
3. Update workflow + mutations + UI to read/write new fields. Deploy.
4. Remove old fields from `validators.ts`. Delete migration.

## 7-day archive

Free — Daytona auto-archives stopped sandboxes at the 7-day default (per `_daytona/git.ts:37` comment). Nothing to wire up.

## Critical files

- `packages/backend/convex/validators.ts` — schema fields
- `packages/backend/convex/_agentTasks/sandbox.ts` — start/stop mutations + ready/error
- `packages/backend/convex/_taskWorkflow/workflowDefinition.ts` — delete→stop, reuse hook
- `packages/backend/convex/_taskWorkflow/queries.ts` — `getTaskData` returns `taskSandboxId`
- `packages/backend/convex/_taskWorkflow/runLifecycle.ts` — add `saveTaskSandboxId`
- `packages/backend/convex/_taskWorkflow/recovery.ts` — clear task.sandboxId on stale cleanup
- `packages/backend/convex/_sessions/sandbox.ts` — reference pattern (don't edit)
- `apps/web/src/lib/components/tasks/useTaskDetail.tsx` — field rename
- `packages/backend/convex/migrations/copyTaskSandboxFields.ts` — new migration

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` after each schema step.
2. End-to-end flow:
   - Create quick task → run → verify completion calls `stopSandbox` (Daytona dashboard shows "stopped", not deleted), `task.sandboxId` retained, `reviewTaskSandboxStatus: "closed"`.
   - Reviewer clicks Start Sandbox → `tryReuseSandbox` resumes same sandbox, DB state intact.
   - Reviewer adds change-request comment → "Make changes" → workflow reuses `task.sandboxId` (no fresh checkout), agent applies fixes on top of preserved state.
   - Reviewer clicks Stop Sandbox → Daytona stop fires immediately, status flips to "closed".
   - Wait 7 days → sandbox auto-archived; Start Sandbox triggers unarchive flow.
3. Migration dry-run: spot-check a few `agentTasks` docs in Convex dashboard pre/post migration.
4. Stale-run recovery: kill a workflow mid-run → `cleanUpStaleRun` deletes sandbox + clears `task.sandboxId` → next run starts fresh.

## Unresolved questions

None — user answers locked in:

1. Auto-stop on completion + 7-day archive (platform default).
2. Same sandbox shared for code review, business review, change-requests, conflict resolution.
3. Collapse to `agentTasks.sandboxId`.
4. Rename to `reviewTaskSandboxStatus`.
5. Daytona stop fires immediately on user click.
6. Daytona stop fires immediately on agent run completion.
