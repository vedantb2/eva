# Phase 0 spike results — GO

Ran against a throwaway Vercel Pro project, `@vercel/sandbox` v2.4.0, runtime
`node24`, 4 vCPU. Numbers below are from live runs (see `spike-results.json`
for the raw 5 GB run).

## Headline: restore latency is flat with snapshot size

| Snapshot size | snapshot() build | cold restore | warm restore (median) |
| ------------- | ---------------- | ------------ | --------------------- |
| 0.79 GB       | 3.2s             | 0.29s        | 0.29s                 |
| 1.22 GB       | 19s              | 0.35s        | 0.29s                 |
| 6.06 GB       | 23s              | 0.33s        | 0.33s                 |

Restore stays **sub-second regardless of size** — Vercel lazy-fetches blocks
rather than downloading the whole image. This is the whole reason for the
migration: eva's ~10 GB seeded snapshots would restore in **~0.3s** vs Daytona's
minutes (and vs 10–40 min archived thaw). Snapshot _creation_ scales with size
but that is build-time only (our `snapshotBuildWorkflow`), not the hot path.

Fresh sandbox create (no snapshot): ~0.4s.

## Capability probes

| Capability                                  | Result | Notes                                                                                   |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Restore warm < 3s                           | ✅     | ~0.3s                                                                                   |
| Restore cold < 30s                          | ✅     | ~0.3s (Vercel keeps recent snapshots warm)                                              |
| Inbound WebSocket over `domain(port)`       | ✅     | echo round-trip through `wss://…vercel.run`; preview proxy + `/__convex` routing viable |
| Native PTY (`openInteractive`)              | ✅     | returns `wss://…/ws/interactive` + token — direct `createPty` replacement               |
| Docker + seeded DB survives restore         | ✅     | seeded Postgres row read back after restore (`select id from t => 1`)                   |
| Detached process + re-attach (`getCommand`) | ✅     | callback agent-runner pattern viable                                                    |

## The one caveat: Docker is not preinstalled

Stock `node24` ships **no container runtime** (`NO_DOCKER | NO_DOCKERD |
NO_PODMAN`). It installs cleanly from the Amazon Linux 2023 repos
(`sudo dnf install -y docker`, ~55s) and, once baked into the snapshot, the
container filesystem + seeded DB restore correctly. Implication for the
migration: install Docker in the **snapshot-build** step (or a custom VCR base
image) rather than at session start. `dockerd` still needs restarting on each
restore — same as eva's existing `ensureDockerDaemon`-on-resume pattern.

## Verdict

All six go/no-go checks pass. Proceed to Phase 1 (the `SandboxProvider`
interface). No need to benchmark Morph — Vercel already hits the target.

## Reproduce

```bash
cd packages/backend/scripts/vercel-sandbox-spike && pnpm install
export VERCEL_TOKEN=... VERCEL_TEAM_ID=team_... VERCEL_PROJECT_ID=prj_...
export SPIKE_BULK_GB=5 SPIKE_WARM_RUNS=4 SPIKE_RUN_TS=$(date -u +%FT%TZ)
node spike.mjs        # benchmark
node cleanup.mjs      # delete all sandboxes+snapshots in the project afterwards
```
