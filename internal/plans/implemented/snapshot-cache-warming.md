# Snapshot Cache Warming

## Problem

Sandbox creation from a snapshot has a cold start (~30s). After a daily snapshot rebuild, the first sandbox creation hits this cold start because Daytona's internal cache is cold.

## Solution

After a successful snapshot build, automatically create a sandbox from the snapshot and immediately delete it. This warms Daytona's cache so subsequent creations are fast.

## Architecture

### Snapshot Rebuild Flow

1. **`rebuild-snapshot.yml`** — GitHub Actions workflow that lives in target repos. Builds a Docker image with the repo's dependencies pre-installed and pushes it to Daytona as a snapshot.
2. **Convex dispatches it** via GitHub API `workflow_dispatch` (from `snapshotActions.ts:rebuildSnapshot`). The `ref` parameter determines which branch the workflow runs from (configurable as "Workflow Branch" in the snapshot settings UI, defaults to `main`).
3. **Convex polls it** until completion (`snapshotActions.ts:pollWorkflowRun`), recording logs along the way.
4. **Convex warms the cache** after success — `completeBuild` schedules `warmSnapshotCache` which creates a sandbox from the snapshot and immediately deletes it.

Everything is orchestrated from Convex. The GitHub Action is just the execution engine.

### Cache Warming Flow

```
completeBuild(status: "success")
  → looks up snapshot doc to get repoId
  → scheduler.runAfter(0, warmSnapshotCache, { repoId })
    → resolveSandboxContext → get daytona client, envVars, snapshotName
    → getRepo → get installationId
    → createSandbox(snapshot) → warms Daytona's cache
    → sandbox.delete() → cleanup
```

Best-effort: wrapped in try/catch, logs errors but never fails.

### Trigger Coverage

Both trigger paths converge at `completeBuild`:

- **Manual** (UI "Rebuild Now") → `startBuild` → `rebuildSnapshot` → `pollWorkflowRun` → `completeBuild` → warms cache
- **Cron** (scheduled) → `triggerScheduledBuild` → `rebuildSnapshot` → `pollWorkflowRun` → `completeBuild` → warms cache

## Cron Schedule Input

Replaced fixed schedule presets (daily/every_3_days/weekly/manual) with free-form cron expression input.

- **Validator**: `snapshotScheduleValidator` is now `v.string()` — accepts any cron expression or `"manual"`
- **Backend**: `resolveCronspec()` handles both new cron strings and legacy preset values. Cron registration uses `{ kind: "cron", cronspec }` instead of `{ kind: "interval", ms }`
- **UI**: Input field with centered text, live preview above showing human-readable translation (`cronstrue`) and next execution time (`cron-parser`). Cron format reference guide below.
- **Migration**: `migrateScheduleToCron` converts old `daily`/`every_3_days`/`weekly` values to cron equivalents

## Files Modified

- `packages/backend/convex/repoSnapshots.ts` — `completeBuild` schedules warming on success; cron registration uses cronspec; migration function
- `packages/backend/convex/daytona.ts` — Added `warmSnapshotCache` internalAction
- `packages/backend/convex/validators.ts` — `snapshotScheduleValidator` → `v.string()`
- `apps/web/.../SnapshotsClient.tsx` — Cron input with live preview, BranchSelect, cron guide
- `.github/workflows/rebuild-snapshot.yml` — Fixed pnpm install to run from monorepo root
