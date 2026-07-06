# VM hot seeded snapshots pilot (Path B)

**Date:** 2026-07-06  
**Status:** Pilot infrastructure landed on dev (`good-mule-506`); carepulse `apps/web` flagged; seed chain in progress at time of writeup.  
**Goal:** Sub-10s session `createSandbox` by booting from **hot memory snapshots** (`includeMemory: true`) instead of cold container filesystem snapshots (~30s).

---

## Problem

Container seeded snapshots in EU work but every new session pays a cold boot: Docker, Supabase, Convex local, etc. must start from a **stopped** filesystem capture. Daily seeded rebuilds keep data fresh but not startup latency.

**Path B (vm-hot):** capture **running** sandbox state (memory + disk) into a VM-class snapshot so the next boot resumes warm processes.

---

## Architecture

```
experimental region (linux-vm, 12 GiB cap)
  │
  ├─ Thin VM snapshot     ubuntu:22.04 pull  (…-vm-thin)
  ├─ Bootstrap via toolbox  apt/node/docker/chrome/…  (execScript, no SSH)
  ├─ Cold VM base         stop → capture (…-vm)
  ├─ Seed prep sandbox    boot from …-vm → clone repo → seed commands
  └─ Hot seeded snapshot  includeMemory: true → seeded-<repoId>-<buildId>
                              seededSnapshotClass: "vm-hot"
```

**Container path (unchanged for non-pilot apps):** EU, 16 GiB, declarative Dockerfile build, cold filesystem seeded snapshots.

---

## Key code changes

| Area                   | What                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `vmHotSeededSnapshots` | Per-repo pilot flag (`githubRepos`)                                                                                              |
| `seededSnapshotClass`  | `"container"` \| `"vm-hot"` on repo + build records                                                                              |
| `vmSnapshotNames.ts`   | `-vm-thin`, `-vm` suffixes; `isVmRegionSnapshotName`, `isVmToolingBaseSnapshot`                                                  |
| `snapshots.ts`         | `VM_SNAPSHOT_REGION = "experimental"`, `kickOffVmBaseSnapshot`, REST hot capture                                                 |
| `helpers.ts`           | Toolbox-only `exec` / `execScript` (chunked b64 upload); VM cwd `/` when `/tmp/repo` missing                                     |
| `git.ts`               | VM thin skip post-create; **VM tooling base clones repo** (no baked `/tmp/repo`); pnpm install skips global reinstall if present |
| `snapshotWorkflow.ts`  | Parallel VM thin → bootstrap → `-vm` base; vm-hot seed chain; `skipStopCommands` for hot capture                                 |
| `snapshotActions.ts`   | `bootstrapVmBaseTooling`, debug ops actions, `pollSeededSnapshotState` with `vmHot`                                              |
| `sessions.ts`          | Route `vm-hot` sandboxes to `experimental`; `[sessionStartup][timing]` logs                                                      |

**Removed:** SSH/`ssh2` workaround — Daytona confirmed toolbox exec works on VM sandboxes when cwd/region/script delivery are correct.

---

## Toolbox exec on VM (Option A)

Earlier failures (`fork/exec /usr/bin/bash`) were misconfiguration, not platform:

1. Use **`experimental`** target for create/get/exec.
2. Use cwd **`/`** on thin VM images (no `/tmp/repo` yet).
3. Deliver scripts via **chunked base64** → `/tmp/eva-script.sh` → `/bin/bash /tmp/eva-script.sh` (avoid `| bash` pipe — toolbox parses badly).
4. **Stop** sandbox before cold capture; **start** before hot capture.

Smoke test: `debugVmBootstrapCapture` → snapshot **active**. Full bootstrap script ~3.5 min via toolbox.

---

## VM bootstrap script

Mirrors container Dockerfile tooling layers inside `ubuntu:22.04` VM (no repo clone — that happens at seed prep).

Notable fix: `build-essential` must install **before** `rm -rf /var/lib/apt/lists/*`, not after.

---

## Region / memory limits (Daytona API probes, 2026-07-06)

| Request                            | Result                            |
| ---------------------------------- | --------------------------------- |
| EU + `linux-vm` + 16 GiB           | `400` — no VM runners in `eu`     |
| EU + `linux-vm` + 12 GiB           | `400` — no VM runners in `eu`     |
| US + `linux-vm` + 16 GiB           | `400` — no VM runners in `us`     |
| experimental + `linux-vm` + 16 GiB | `400` — max 12 GiB per VM sandbox |
| experimental + `linux-vm` + 12 GiB | **Works**                         |

**Conclusion:** vm-hot pilot must stay **experimental + 12 GiB** until Daytona adds EU VM runners and/or raises VM memory quota (`support@daytona.io`).

---

## Carepulse pilot (dev `good-mule-506`)

| Resource                      | ID / name                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- |
| Carepulse web repo            | `mh7fdbcrhbt6wbwqkdxr0xe4c182502a`                                         |
| Monorepo parent (Daytona ops) | `mh7ca667pjd7fjaqtw6n86vxex82jev6`                                         |
| Repo snapshot config          | `rh74g8w7mczaf7m7kg0vhnj1y181tyh2`                                         |
| Container base                | `snapshot-mh796tpcm1h0a0amat46r27wms81gwz3` (EU, active)                   |
| VM thin                       | `snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-thin` (experimental, active) |
| VM tooling base               | `snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm` (experimental, **active**)  |

### Bootstrap carepulse dev

```powershell
$env:CONVEX_DEPLOYMENT="dev:good-mule-506"
cd packages/backend
node scripts/vm-hot-carepulse-pilot-bootstrap.mjs   # sync commands, enable flag, forceImageRebuild
```

### Ops scripts (`packages/backend/scripts/`)

- `run-debug-vm-exec-test.mjs` — toolbox exec smoke
- `run-vm-bootstrap.mjs` — full bootstrap + cold capture
- `run-vm-smoke-capture.mjs` — minimal script + capture
- `test-vm-seed-prep.mjs` — seed prep from `-vm` base
- `try-eu-vm-16gb.mjs` / `try-vm-regions-matrix.mjs` — region/memory matrix
- `poll-vm-hot-build.mjs [buildId]` — build status
- `vm-hot-carepulse-pilot-bootstrap.mjs` — one-shot pilot setup

### Convex debug actions

- `snapshotActions:debugVmExecTest`
- `snapshotActions:debugVmBootstrapScriptOnly`
- `snapshotActions:debugVmBootstrapCapture`
- `snapshotActions:debugKickOffVmSnapshot` (optional `regionId`, `memory`)
- `snapshotActions:debugListDaytonaRegions`
- `snapshotActions:inspectDaytonaSnapshot` (optional `vmHot: true`)

---

## Seed chain notes

VM tooling base has **no baked repo** — `createSandboxAndPrepareRepo` detects `isVmToolingBaseSnapshot` and runs `cloneAndSetupRepo` instead of `normalizeSnapshotWorktree`.

vm-hot apps boot from: previous `vm-hot` seeded snapshot **or** active `-vm` base (no container fallback).

At capture time: `skipStopCommands: true` so daemons stay running for hot memory snapshot.

Poll VM snapshots with `vmHot: true` / `getDaytonaForSnapshotName` — EU client cannot see experimental snapshots.

---

## Open items

1. Complete vm-hot **seed chain** for carepulse `apps/web` on dev (build `rn7c19…` was running at handoff).
2. **Session timing test** — compare `[sessionStartup][timing]` vm-hot vs container seeded.
3. Promote pilot flag / defaults after latency validation.
4. Ask Daytona: EU `linux-vm` runners + 16 GiB VM quota.

---

## Related docs

- `internal/plans/todo/running-sandbox-snapshot-seeded-db.md` — original filesystem snapshot design (container, EU).
- `SNAPSHOT_BUILD_HANDOFF.md` — broader snapshot build pipeline debugging (separate from vm-hot).
