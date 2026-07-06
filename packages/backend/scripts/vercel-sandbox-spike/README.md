# Vercel Sandbox — Phase 0 spike

Go/no-go benchmark for the Daytona → Vercel Sandbox migration. See the plan at
`~/.claude/plans/i-think-we-need-enchanted-biscuit.md`.

## What it measures

The migration's whole premise is that Vercel restores a heavy snapshot (whole
codebase + `node_modules` + local DB state) in **seconds**, not the minutes
Daytona takes. This script:

1. Builds a realistic "heavy" sandbox — clone a large repo, install deps,
   best-effort start Docker + a seeded Postgres — then `snapshot()` it.
2. Restores from that snapshot several times to separate **cold-cache** from
   **warm-cache** latency.
3. Probes the capabilities eva depends on that Vercel does not clearly document:
   - **inbound WebSocket** through a per-port public URL (our preview proxy and
     local-Convex `/__convex` routing need this),
   - **detached long-running process + re-attach** (our callback agent runner).

It writes a timing table to stdout and `spike-results.json`.

## Prerequisites

- Node 22+ (uses the global `WebSocket` client).
- A throwaway Vercel **Pro** project (Hobby caps sessions at 45 min).
- An access token scoped to that project.

## Run

```bash
cd packages/backend/scripts/vercel-sandbox-spike
pnpm install                      # installs @vercel/sandbox in an isolated dir

export VERCEL_TOKEN=...            # Vercel access token
export VERCEL_TEAM_ID=team_...
export VERCEL_PROJECT_ID=prj_...
export SPIKE_RUN_TS=$(date -u +%FT%TZ)   # stamped into results (script can't call Date.now at import)

# optional overrides
# export SPIKE_REPO_URL=https://github.com/your-org/your-heavy-repo.git
# export SPIKE_WARM_RUNS=5
# export SPIKE_RUNTIME=node24

pnpm spike
```

## Reading the verdict

`spike-results.json` ends with a `verdict` block against the plan's thresholds:

| Check                | Target                                         |
| -------------------- | ---------------------------------------------- |
| `warmUnder3s`        | warm-cache restore median ≤ 3s                 |
| `coldUnder30s`       | cold-cache restore ≤ 30s                       |
| `websocketOk`        | inbound WS over the public port URL works      |
| `detachedReattachOk` | `getCommand` re-attaches to a detached process |

If restore latency fails, run the same shape of test on **Morph** (claims
<250 ms full-VM branch/restore) before deciding — see the plan's fallback note.

## Caveats

- A few SDK call shapes are marked `VERIFY` in `spike.mjs` (the `source`
  snapshot shape, `ports` param, detached command id field, `getCommand`
  signature, `sandbox.domain()` return). The first real run confirms them
  against the installed `@vercel/sandbox` types; all such calls funnel through
  the thin wrappers at the top of the file, so fixes are one-line.
- Docker-in-sandbox and the seeded DB are **best-effort**; failures there are
  logged and do not abort the restore benchmark.
- This harness is intentionally isolated from the Convex backend — it shares no
  code and its own `package.json` keeps `@vercel/sandbox` out of the backend
  dependency tree until we commit to the migration.

```

```
