# Seed-prep sandbox teardown after seeded snapshot builds

**Status:** todo (handoff)  
**Date:** 2026-07-22  
**Owner context:** CarePulse `apps/web` seeded snapshot builds on Eva prod; Vercel sandboxes project `evalucom/carepulse-ts`.

## Symptom

Seeded snapshot build can report **success**, but the prep sandbox stays **active/running** on [Vercel → carepulse-ts → Sandboxes](https://vercel.com/evalucom/carepulse-ts/sandboxes). Confirmed after a successful seed that produced `snap_LQGhSUet858bJ6O3Bywbjw1SPBsJ` for `evalucom/carepulse-ts` apps/web (`mh7fdbcrhbt6wbwqkdxr0xe4c182502a`).

Build UI log only shows:

```text
Seeding snapshot: building fresh sandbox with toolchain + deps + seed commands (branch: staging).
Seeded snapshot snap_… built for this app.
```

No delete confirmation / failure in the build record.

## Important distinction (do not confuse)

| Mechanism               | What it does                                                            | What it does NOT do                            |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| Repo `stopCommands`     | Inside-VM cleanup before snapshot (e.g. `pkill convex`, `pnpm stop-db`) | Does **not** stop/delete the Vercel sandbox    |
| `deleteSeedPrepSandbox` | Provider delete of the prep VM after seed                               | Currently best-effort; failures swallowed      |
| `stopAllRepoSandboxes`  | Tag-scoped sweep of leftover seed-prep sandboxes                        | **Defined but never called** from the workflow |

CarePulse web `stopCommands` (prod, for reference):

```text
pkill -TERM -f "convex dev" …
pkill -TERM -f "convex-local-backend" …
sleep 3
pnpm stop-db
```

## Current intended lifecycle

File: `packages/backend/convex/snapshotWorkflow.ts` (seeded path).

1. `createSeedPrepSandbox` — tags purpose=`snapshot-seed-prep` (`SANDBOX_TAG.purpose` / `SEED_PREP_LABEL_VALUE`).
2. `launchSeedRun` / `pollSeedRun` — runs seed + `stopCommands` inside VM, then marks done.
3. `triggerSeededSnapshot` + `pollSeededSnapshotState` until snapshot `active`/`ready`.
4. **`deleteSeedPrepSandbox`** with `preserveSnapshotId: effectiveSeededName` (keep new `snap_*`).
5. `completeBuild(success)`.

Failure paths also call `deleteSeedPrepSandbox` (without preserve, or after deleting partial snap).

## Root cause (why VM can linger)

1. **`deleteSeedPrepSandbox` swallows errors** (`packages/backend/convex/snapshotActions.ts` ~1224–1252). Catch → `console.error` only → build still succeeds. Failures never hit `repoSnapshots.appendLogs` / build UI.
2. **Possible Vercel timing:** after seed capture, session may still be `running` / `snapshotting`. `VercelSandboxHandle.delete()` (`_sandbox/vercelProvider.ts` ~811–833) goes straight to snapshot purge + `sandbox.delete()`; it does **not** call `stop()` first. Elsewhere in the same provider, stop/delete while snapshotting is known to be fragile (session stop helpers, wait-for-stop).
3. **Safety net never wired:** `stopAllRepoSandboxes` (`snapshotActions.ts` ~1331–1409) lists Vercel sandboxes, filters `eva.purpose=snapshot-seed-prep` + matching `repoId`, deletes matches. Grep shows **definition only** — no `step.runAction(internal.snapshotActions.stopAllRepoSandboxes, …)` in `snapshotWorkflow.ts` (or elsewhere). Comment claims “workflow already deletes…; this only catches leaks” but the action is dead code for the workflow.

## Related recent CarePulse seed work (context only — already shipped)

Not part of this plan’s code change, but same surface area:

1. **Convex GLIBC pin** — Vercel Sandbox = Amazon Linux 2023 (glibc **2.34**). Convex linux-gnu from `precompiled-2026-07-15-*` onward needs **GLIBC_2.35**. Pin plants `precompiled-2026-07-14-7b3d1a5` under latest cache label (`packages/backend/convex/_daytona/convexLocalBackend.ts`). Break first seen cron **22 Jul 06:00 UK** (`precompiled-2026-07-21-82d5e9f`); 14–21 Jul cron still succeeded.
2. **Prisma vs Supabase race** — apps/web **background** cmd #3 was `until … health=healthy … && pnpm migrate` racing `pnpm start-db` migrations → `CommentStatus already exists` → empty dump → `failed:capture-runtime-state`. **Fixed on prod DB** via `githubRepos:setRepoCommandsInternal` for `mh7fdbcrhbt6wbwqkdxr0xe4c182502a`: migrate now waits for `Started supabase local development setup` in `/tmp/bg-0.log` (one-liner). That is **repo config**, not Eva code.

## Recommended fix (implement)

Keep scope small. Do all three:

### A. Stop-then-delete in `deleteSeedPrepSandbox`

In `snapshotActions.deleteSeedPrepSandbox` (and/or `VercelSandboxHandle.delete` if that’s the cleaner place):

1. Best-effort `handle.stop()` (or provider stop) when session is live / stop-in-flight.
2. Then existing delete + `preserveSnapshotIds` sweep.
3. Do **not** change Daytona semantics beyond “stop if needed then delete” if already fine.

### B. Surface failures on the build log

- Return a result from `deleteSeedPrepSandbox` (e.g. `{ ok: boolean, error?: string }`) **or** accept optional `buildId` and `appendLogs` on failure.
- Workflow should append something like:  
  `[teardown] failed to delete seed-prep sandbox <id>: <msg>`  
  so success builds don’t look clean while a VM is still billing.
- Prefer **not** failing the whole build solely because teardown failed (snapshot already captured) — but make the leak visible. Product call: warn-only vs fail-build; default **warn + appendLogs**.

### C. Wire `stopAllRepoSandboxes` at end of seeded workflow

In `snapshotWorkflow.ts` seeded path, after success **and** on failure (finally-style):

```ts
await step.runAction(internal.snapshotActions.stopAllRepoSandboxes, {
  seedableRepoIds: /* same ids used for this build */,
});
```

Constraints already documented on the action:

- Filter **strictly** by `purpose=snapshot-seed-prep` + repoId set.
- Must **not** delete session/task sandboxes (`persistent` / `ephemeral`).
- Best-effort; must not fail the build if sweep fails (but log / append if easy).

Also append a one-liner to build logs when sweep deletes `n > 0` sandboxes (proves safety net fired).

## Files to touch

- `packages/backend/convex/snapshotActions.ts` — `deleteSeedPrepSandbox`, maybe return type; ensure `stopAllRepoSandboxes` still tag-safe.
- `packages/backend/convex/_sandbox/vercelProvider.ts` — optional: stop-before-delete inside `delete()`.
- `packages/backend/convex/snapshotWorkflow.ts` — call sweep on all exit paths; append teardown log lines.
- `internal/changelog.md` — medium change entry after ship.
- Tests if any exist around snapshot teardown; otherwise minimal unit/integration only if cheap.

## Verification

1. Trigger CarePulse apps/web seeded snapshot build on prod (or staging with Vercel creds).
2. Build succeeds → check [Vercel sandboxes](https://vercel.com/evalucom/carepulse-ts/sandboxes): prep VM gone (or stopped/destroyed), not left running.
3. Build log contains either delete success note or explicit teardown failure text.
4. Confirm a normal session/task sandbox for the same project is **not** deleted by the sweep (tag filter).
5. Convex function logs: `[vercel] delete…` / `[snapshot] stopAllRepoSandboxes: deleted N…`.

## Out of scope

- Making `stopCommands` delete Vercel sandboxes.
- CarePulse migration idempotency for `CommentStatus` (race fixed via background command order).
- Changing Convex local-backend pin.
- Root-repo `VERCEL_PROJECT_ID` base-build failures (separate ongoing issue).

## Unresolved questions for implementer / product

1. Teardown failure: warn-only (recommended) or fail the build?
2. Should `completeBuild(success)` run **after** teardown logging so the final log chunk includes teardown, or append after complete?
3. Manual cleanup of currently orphaned running sandboxes on Vercel — one-shot ops vs leave for next sweep after deploy?

## Final step

After implementation: `/ship` (commit + push to main per repo rules) unless told not to.
