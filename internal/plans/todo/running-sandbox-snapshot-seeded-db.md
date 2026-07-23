> Note (2026-07-23): Daytona provider code removed — Vercel-only. Re-scope any Daytona-specific steps before executing.

# Running-sandbox filesystem snapshots (seeded DB baked in)

> **2026-07-23:** Daytona is gone — eva is Vercel-only now. This plan's `daytona.create`/`_experimental_createSnapshot`/SDK-version mechanics below are historical (Daytona-era) and need re-deriving against `@vercel/sandbox` before this is actionable again.

## Goal

Cut ~10-min cold-start cost. Today the per-repo Daytona snapshot is a **Dockerfile/Image**
build (clone + `pnpm install` + buildCommands). The DB setup + seed (local Supabase + Convex
in Docker-in-Docker, migrate, seed) runs as **startup commands on every sandbox start** — that's
the 10 min.

New: daily cron produces a **filesystem snapshot of a fully-prepared, DB-seeded running sandbox**,
so new sandboxes resume with seeded Docker volumes already on disk and skip the seed.

## Key SDK facts (verified)

- `sandbox._experimental_createSnapshot(name, timeout?)` → captures **filesystem only** (not
  memory/processes). Sandbox enters `snapshotting` then returns to prior state. Returns `Promise<void>`.
- `daytona.create({ snapshot: name })` consumes it — same call we use today.
- Endpoints landed in `@daytonaio/sdk` 0.165.0 (14 Apr 2026). We are on **0.143.0** → upgrade required.
- Method is `_experimental_`-prefixed (unstable name) but **docs show no region gating**. The
  "experimental region" in the announcement is for _memory_ pause/resume — not needed here.

## Why filesystem-only is the right fit

Docker-in-Docker stores Postgres/Convex data under `/var/lib/docker`. A filesystem snapshot
captures it **iff the data is flushed + consistent at snapshot time**. So: seed → **cleanly stop
DB containers** (Postgres checkpoint/flush) → snapshot. Memory state is irrelevant; on resume we
just restart containers against the existing volumes — no re-seed.

## Architecture: AUGMENT the existing Image build (revised — simplest path)

The existing per-repo Image already bakes a perfect boot base: toolchain (node, docker, chrome, VNC,
CLIs, claude plugins, supabase/convex CLI) + clone + deps + buildCommands + uploaded config files
(`/home/eva/sandbox-config/`, incl. `data.sql` / `carepulse-staging-backup.zip`). **Keep it as-is.**

Add ONE new stage to the cron, after the Image is `active`:

1. Boot a sandbox from the per-repo Image.
2. Run `startupCommands` (services up) → `seedCommands` (the ~10-min seed, once).
3. Run `stopCommands` (clean-stop) so volumes flush.
4. `sandbox._experimental_createSnapshot(seededSnapshotName)` — captures the full filesystem incl.
   seeded Docker volumes.
5. Delete the prep sandbox.

Sandboxes then `daytona.create({ snapshot: seededSnapshotName })` — a self-contained filesystem with
the seeded DB on disk. The Image is only a build-time base.

Why this over the earlier "replace / two-layer split": no separate global base-toolchain image to
build or scope; reuses ALL existing code (Image build, config files, delete-existing, cron, UI);
strictly smaller surface. The seeded snapshot uses a distinct name (e.g. `snapshot-<repoId>-seeded`)
so it doesn't collide with the Image name it booted from; the cron deletes the prior seeded snapshot
each run → latest-only (matches the daily 24 h retention).

## Config model — split today's single startup-commands blob

Today `settings/app` has ONE "Startup commands" list, run on every start. The seed steps depend on
services being up, so they interleave — but they split into two **ordered phases** (startup brings
services up; seed runs after). Introduce on `githubRepos` (settings/app UI):

- **`startupCommands`** (repurpose existing) — bring services up. Run on EVERY start incl. warm
  restore from a seeded snapshot.
- **`seedCommands`** (new) — data load. Run ONCE during snapshot build, after startup. Baked in.
- **`stopCommands`** (new) — clean shutdown before snapshot, so on-disk data is consistent.

### carepulse-ts mapping (current commands, re-split)

```
# startupCommands (always; carepulse)
pnpm start-db                                   # supabase start — reuses seeded volumes on warm restore
cd apps/web && (nohup env CONVEX_AGENT_MODE=anonymous npx convex dev > /tmp/convex.log 2>&1 &) \
  && for i in $(seq 1 120); do grep -q "Convex functions ready" /tmp/convex.log && break; sleep 2; done \
  && (grep -q "Convex functions ready" /tmp/convex.log || (tail -80 /tmp/convex.log && exit 1))

# seedCommands (once, during build, after startup)
cp data.sql packages/db/data.sql
cp carepulse-staging-backup.zip apps/web/carepulse-staging-backup.zip
rm -f data.sql carepulse-staging-backup.zip
pnpm seed:sql                                   # seeds postgres (volume captured by snapshot)
cd apps/web && npx convex import carepulse-staging-backup.zip
cd apps/web && npx convex env set BASE_APP_URL http://localhost:3000
cd apps/web && npx convex env set NEXT_PUBLIC_API_URL https://staging.carepulse.co.uk
touch /home/eva/.db-seeded

# stopCommands (clean shutdown before _experimental_createSnapshot)
pkill -TERM -f "convex dev" 2>/dev/null || true            # flush convex local backend (sqlite)
pkill -TERM -f "convex-local-backend" 2>/dev/null || true
sleep 3
pnpm stop-db                                                # supabase stop — retains seeded volumes
```

Note: `convex env set` values persist in the local backend store (captured) → no re-run on resume.
The `.db-seeded` marker (captured) lets cold/no-snapshot starts know whether to seed.

## Build flow (cron — existing Image build, then a NEW seed-snapshot stage)

Existing steps unchanged: delete old Image → `kickOffSnapshotBuild` (Dockerfile) → poll until
`active`. Then add the new stage as further workflow steps:

1. Delete prior seeded snapshot (`snapshot-<repoId>-seeded`) — reuse `deleteExistingSnapshot` logic.
2. `daytona.create({ snapshot: <repo Image> })` (warming/ephemeral lifecycle, disk 10 GB).
3. Start dockerd; run **`startupCommands`** (services up) then **`seedCommands`** (the ~10-min seed,
   ONCE; ends with `touch /home/eva/.db-seeded`).
4. Run **`stopCommands`** — clean-stop convex local backend + `supabase stop` so volumes flush
   consistently. Keep volumes.
5. `sandbox._experimental_createSnapshot("snapshot-<repoId>-seeded", timeout)`.
6. `sandbox.delete()` the prep sandbox; record build success.
7. `getRepoSnapshotName` returns the **seeded** name when its build succeeded, else falls back to the
   Image name → `createSandbox` picks it up via `daytona.create({ snapshot })`.

Reuse existing `repoSnapshots` / `snapshotBuilds` tables, cron schedule, logs, settings UI, config
files — add only the seed-snapshot workflow steps + the `seeded` snapshot name + the three command
fields.

## Resume flow (sandbox created from seeded snapshot — warm-start path)

`createSandboxAndPrepareRepo` already: normalize worktree, sync git, install cred helper, copy config.
Then the startup path simply runs **`startupCommands` only** (NOT `seedCommands`), because the
snapshot already carries `.db-seeded` + seeded volumes:

- `pnpm start-db` (supabase start) re-attaches to the seeded Postgres volume.
- Relaunch `convex dev` (anonymous) → reads the existing seeded local-backend store + env vars.
- App dev server launches as today (`launchDevServerInBackground`).
- `ensureDockerDaemon` + eva-entrypoint already restart dockerd on resume.

Cold/no-snapshot fallback path runs `startupCommands` + `seedCommands` (full setup) as today.

**Primary risks to validate in the spike:**

1. `supabase start` re-attaches to existing on-disk volumes after a fresh snapshot create (container
   IDs/networks gone, volumes remain) — and does NOT re-run migrations/seed over them.
2. Anonymous `convex dev` reuses the existing local deployment + seeded data (deployment identity is
   on the snapshotted filesystem) rather than spinning a fresh empty deployment.

## Region decision — DECIDED: stay on default region

No pool migration. Filesystem snapshot/fork are SDK methods available without the experimental
region. Keep `getDaytona` on the default region; the only prerequisite is the SDK bump. Avoids the
high blast radius of migrating every call site and orphaning existing default-region `sandboxId`s
in the DB. (Phase 0 spike still empirically confirms the endpoints work on the default region.)

## Phases

- **Phase 0 — Spike (make-or-break, do first).** Target repo: `carepulse-ts`. Branch-bump SDK
  ≥0.165.0; confirm `_experimental_createSnapshot`/`_experimental_fork` exist by reading
  `node_modules/@daytonaio/sdk/dist/*.d.ts`. Manually: boot from base, run startup+seed, clean-stop,
  `_experimental_createSnapshot`, create new sandbox from it. Verify: (a) seeded Postgres present &
  `supabase start` does not re-migrate/seed; (b) anonymous `convex dev` reuses seeded deployment;
  (c) services up in <~1 min vs ~10; (d) snapshot size + restore time acceptable; (e) endpoints work
  on default region. Decide go/no-go.
- **Phase 1 — SDK upgrade + breaking-change audit** across all `@daytonaio/sdk` call sites
  (create/get/start/stop/archive/delete/refreshData, process.executeCommand, fs, git._, volume._,
  snapshot.\*, Image). Typecheck via `cd packages/backend && npx convex codegen --typecheck enable`.
- **Phase 2 — Config fields. ✅ DONE (Model A).** Reused existing `startupCommands` (run-once, seed) +
  `backgroundCommands` (every-start, services); added ONE new field `stopCommands`. Files: schema
  `_validators/tableFields.ts` (githubRepoFields), `updateConfig` mutation, settings/app `AppClient.tsx`
  (new Stop Commands section + clarified Startup/Background copy). Also **reordered `prepareSandboxSteps`**
  so `backgroundCommands` (services) run BEFORE `startupCommands` (seed) — safe because on resume startup
  is marker-skipped, so background never depends on a same-boot startup. Seeds now self-wait for service
  readiness (background launches detached). Backend + web typecheck clean.
  **DB migrated on dev:evalucom (good-mule-506)** — carepulse-ts is a 3-repo monorepo; rebucketed each:
  web `mh7fdbcr` (supabase+convex), eproc `mh78235g` (convex-only, secrets preserved in-DB), parent
  `mh7ca667` (supabase-only). Migration done via throwaway `_spike/migrateCommands.ts` (read-transform-
  write, so secrets never hit source). NOTE: convex-readiness wait greps `/tmp/bg-<index>.log` — index
  depends on backgroundCommands order (web convex=bg-1, eproc convex=bg-0).
- **Phase 3 — Seed-snapshot workflow stage. ✅ DONE (per-app model).** After the base Image goes
  `active`, `snapshotWorkflow.ts` now builds a seeded snapshot for EACH app repo with stopCommands
  (`getSeedableAppRepos`): boot prep sandbox from the Image (`createSeedPrepSandbox`, explicit Image
  name to bypass the seeded preference) → `runBackgroundCommands`(services) → `runStartupCommands`(seed)
  → `runStopCommands`(NEW, clean-stop) → `createSeededSnapshot`(NEW, `_experimental_createSnapshot`,
  timeout 600) → `deleteSandbox` → `setSeededSnapshotName`. Best-effort: on failure the prep sandbox is
  deleted and the app falls back to the Image (seededSnapshotName left clear). New schema field
  `githubRepos.seededSnapshotName`; `getRepoSnapshotName` prefers it. New re-exports in `repoSnapshots.ts`.
  Backend typechecks clean. Every new code path smoke-tested end-to-end on dev for the web app
  (chain ran 0-error; getRepoSnapshotName flipped to the seeded name; smoke artifact then cleaned up).
- **Phase 4 — Warm-start path. ✅ SATISFIED by Phase 2's reorder + the marker.** A sandbox created
  from a seeded snapshot has the `/tmp/.startup-commands-done` marker baked in, so `runStartupCommands`
  (seed) is skipped; `runBackgroundCommands` (services) runs every start (now before startup). No
  separate code needed. Verified end-to-end in Phase 2's verification run.

## Minimised surface

- Schema: add `startupCommands` / `seedCommands` / `stopCommands` to `githubRepos`; seeded build
  reuses `repoSnapshots` / `snapshotBuilds` (no new tables).
- Existing Image build, config-files pipeline, cron trigger, delete-existing logic: unchanged —
  new workflow steps appended, not rewritten.
- `getRepoSnapshotName` returns the seeded name (fallback to Image) — consumers unchanged.
- `getDaytona` unchanged (no region migration).

## Unresolved questions

1. ~~**Region**~~ — DECIDED: default region, SDK upgrade only.
2. ~~**Seed/startup commands**~~ — RESOLVED: `startupCommands` / `seedCommands` / `stopCommands`
   split (carepulse mapping above). Confirm `stopCommands` checkpoint convex cleanly in the spike.
3. ~~**Disk size**~~ — DECIDED: keep at 10 GB max. ⚠ RISK: seeded Postgres + supabase/convex docker
   images + node_modules may be tight in 10 GB — the spike MUST measure actual `/` + `/var/lib/docker`
   usage; if it overflows, slim (prune unused docker images, drop dev deps) before proceeding.
4. ~~**Base toolchain scope**~~ — DROPPED: augment approach reuses the existing per-repo Image; no
   separate base image.
5. ~~**Seed-data confidentiality**~~ — ACCEPTED by user (staging backup baked into snapshot is fine).
6. ~~**Snapshot retention**~~ — DECIDED: latest-only, rebuilt daily (24 h); reuse delete-existing.

## Phase 0 spike — runnable checklist (the gate)

Goal: empirically answer the two make-or-break unknowns (fits in 10 GB? services re-attach to seeded
volumes?) before any production code. Target repo: `carepulse-ts`. Throwaway only — delete after.

### Setup

- [ ] Branch off `main`.
- [x] Bump `@daytonaio/sdk` → `^0.167.0` (the version Daytona's announcement validated; latest is
      0.183 — Phase 1 can go latest with a full audit). `pnpm install` done; backend resolves 0.167.0.
- [x] **Methods verified in installed source** (`node_modules/.pnpm/@daytonaio+sdk@0.167.0/.../Sandbox.d.ts`):
      `_experimental_createSnapshot(name: string, timeout?: number): Promise<void>` (filesystem-only,
      enters 'snapshotting' then restores state) and `_experimental_fork(params?, timeout?)`.
- [x] Typecheck CLEAN: `npx convex codegen --typecheck enable` → exit 0. No breaking changes from
      0.143→0.167 across any SDK call site; spike file typechecks (proves the method is on the type).

### Harness (throwaway internalAction, triggered from Convex dashboard)

Write a temporary `internalAction` (e.g. `convex/_spike/seededSnapshot.ts`) reusing `getDaytona`,
`getSandbox`, `exec`. It should log timings + disk at each step. Steps:

1. [ ] Create sandbox from carepulse's **existing Image** snapshot (`snapshot-<repoId>`), default
       region. Log `sandbox.target` (confirm NOT experimental) + `sandbox.id`.
2. [ ] Run `startupCommands` (start-db; launch + await `convex dev`). Log elapsed.
3. [ ] Run `seedCommands` (cp's, `pnpm seed:sql`, `convex import`, `convex env set` ×2, `touch
   /home/eva/.db-seeded`). Log elapsed (expect ~10 min).
4. [ ] **Measure disk BEFORE snapshot**: `df -h /`, `du -sh /var/lib/docker`, `du -sh ~`. Record
       total vs 10 GB cap. ← gate (1).
5. [ ] Run `stopCommands` (pkill convex (TERM), `supabase stop`). Confirm no errors; check the
       supabase postgres volume still listed (`docker volume ls`).
6. [ ] `sandbox._experimental_createSnapshot("spike-carepulse-seeded")`. Log elapsed + any state
       transitions; confirm it returns and the call doesn't error.
7. [ ] Create a NEW sandbox from `spike-carepulse-seeded`. Log create/restore elapsed.
8. [ ] On the new sandbox, run `startupCommands` ONLY (no seed). Log elapsed. ← target ≪ 10 min.
9. [ ] **Validate re-attach** ← gate (2):
   - Postgres: query a seeded table row count via `supabase`/psql; matches step 3. Confirm
     `supabase start` did NOT re-run migrations/seed (check its log output).
   - Convex: query seeded data; `convex env get BASE_APP_URL` returns the seeded value (proves
     deployment reuse, not a fresh empty one).
   - App: dev server boots, page loads.
10. [ ] Record: snapshot size, create-from-snapshot time, total warm-start time (create → app ready).
11. [ ] Cleanup: delete both sandboxes + the `spike-carepulse-seeded` snapshot; remove the spike
        action + revert the SDK bump if not proceeding.

### RESULTS — 2026-05-30, dev:evalucom (good-mule-506), carepulse-ts — ✅ GREEN

Ran end-to-end against real Daytona (default `eu` region). Both gates pass.

- **GATE 2 (re-attach) — PASS.** Restored sandbox from the seeded snapshot:
  Postgres `140 tables / ~1,603,273 live rows` survived; Convex env var `BASE_APP_URL=http://localhost:3000`
  persisted (anonymous deployment + 54,112 imported docs re-attached); `.db-seeded` marker present.
  **No re-seed ran** — only `pnpm start-db` + `convex dev`.
- **GATE 1 (disk) — PASS / reframed.** `/var/lib/docker` = **12–13 G on a SEPARATE mount**, larger than
  the 10 G root overlay (root only ~0.8 G used, 8%). The filesystem snapshot **captured + restored the
  separate docker mount fully** — this was the key uncertainty, resolved positively. The 10 G "cap" is the
  root disk param and is NOT the binding constraint; Daytona stores the full multi-mount state.
- **Region — confirmed default.** Sandbox `target=eu`; `_experimental_createSnapshot` works without the
  experimental region. No migration needed.
- **Timings.** Seed (one-off): start-db 56 s + seed:sql 13 s + convex import 17 s. Snapshot create **~4.7 min**.
  Warm restore: create 26 s + start-db 33 s + convex dev 14 s ≈ **73 s to a seeded, running stack** (vs ~10 min).

Findings to fold into the real implementation (Phases 1–4):

1. `_experimental_createSnapshot(name, timeout)` — `timeout` is the **HTTP request timeout** (timeout\*1000 ms).
   `0` aborts immediately ("fetch failed"). Pass a positive value (used 600 s).
2. Convex import must be **`--replace-all --yes`** — the anonymous deployment is non-empty after `convex dev`
   boots the app, so a plain import hits an ID-space collision.
3. `ensureDockerDaemon` logs "Docker not available" right after restore (race), but the snapshot's
   entrypoint brings dockerd up — `supabase start` succeeded. Benign, but the warm-start path should
   tolerate the race (it does).
4. SDK 0.143→0.167 bump validated at runtime on dev (create/get/exec/git all worked). Phase 1 unblocked.

### Pass criteria (go/no-go)

- Total disk ≤ 10 GB with headroom. (else: slimming pass first)
- `supabase start` + `convex dev` re-attach to seeded data with NO re-seed/re-migrate.
- Warm start materially faster than ~10 min (target ≲ 2 min).
- `_experimental_createSnapshot` works on the default region.

### Gotchas to watch

- `supabase start` may run `migration up` on boot — confirm it's a no-op against an already-migrated
  volume and doesn't wipe data.
- Anonymous `convex dev` deployment identity must live on the snapshotted filesystem (else it spins a
  fresh empty deployment). Note WHERE it persists (project `.convex` vs `~/.cache`).
- Postgres consistency: if `supabase stop` didn't flush cleanly, restored data may be corrupt — watch
  postgres startup logs on the restored sandbox.
- Snapshot may require a particular sandbox state; confirm whether containers must be stopped (we stop
  them anyway for consistency).
