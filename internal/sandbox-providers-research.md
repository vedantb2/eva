# Sandbox Providers Research

Research on sandbox providers for running agent tasks, with focus on:

1. Whether custom startup commands (like `pnpm start-db` + `pnpm seed:sql`) can be baked into snapshots
2. Pricing comparison for our typical config (4 vCPU + 8 GB RAM + 10 GB storage)

## Problem statement

On Daytona, custom startup commands (e.g. starting a local Supabase db and seeding it) have to run on every sandbox creation. They can't be baked into the snapshot because:

- Snapshots are Docker/OCI images, not VM snapshots — they capture filesystem layers only, not running processes.
- Supabase CLI runs Postgres inside nested Docker containers (Daytona sandboxes are Docker-in-Docker). The Postgres data lives in Docker volumes inside the nested daemon, which aren't captured by the outer sandbox snapshot.
- "Running Sandbox Snapshotting" is an open feature request on Daytona: https://github.com/daytonaio/daytona/issues/2519 — maintainers confirm it's not currently possible.

Direct quote from Daytona docs: _"Ensure that the entrypoint is a long-running command. If not provided, or if the snapshot does not have an entrypoint, `sleep infinity` will be used as the default."_ — confirms every boot runs entrypoint fresh.

### What CAN be baked into a Daytona snapshot

- Docker image pulls (so nested Supabase containers don't re-pull every boot) — saves ~60–180s on cold start
- Dependencies (node_modules, built assets, apt packages)

### What CAN'T be baked

- Running processes (db servers, app servers)
- Nested Docker volume state (Supabase's Postgres data)
- Memory/process state of any kind

## Startup time impact (estimates)

For `pnpm start-db` + `pnpm seed:sql`:

| Scenario                                  | Time            |
| ----------------------------------------- | --------------- |
| `supabase start` cold (images not cached) | 60–180s         |
| `supabase start` with images pre-baked    | 15–40s          |
| `pnpm seed:sql` small seed (<100 rows)    | 1–3s            |
| `pnpm seed:sql` medium (1k–10k rows)      | 3–15s           |
| `pnpm seed:sql` large (100k+ rows)        | 30s–several min |

**Rule of thumb:** if total cold startup > 90s, bake Docker images into snapshot. If < 30s, not worth the snapshot rebuild overhead.

## Sandbox provider landscape

### Category A — microVMs with FULL running-state snapshots

These capture memory + processes + filesystem — a resumed sandbox has its DB already running, seed data loaded, app servers still listening.

| Provider                  | Isolation              | Snapshot captures                                                                 | Resume time |
| ------------------------- | ---------------------- | --------------------------------------------------------------------------------- | ----------- |
| **Morph Cloud**           | microVM (Infinibranch) | Complete running state including processes; fork to N copies from same live state | <250ms      |
| **Blaxel**                | microVM                | Full filesystem & memory, processes preserved                                     | ~25ms       |
| **Freestyle**             | microVM                | Memory snapshots + cached layers                                                  | <100ms      |
| **E2B**                   | Firecracker microVM    | Filesystem + memory state + running processes + loaded variables                  | ~1s         |
| **Vercel Sandbox**        | Firecracker microVM    | Snapshot + persistent sandboxes (beta)                                            | Sub-second  |
| **Together Code Sandbox** | microVM                | Memory snapshotting                                                               | ~500ms P95  |
| **CodeSandbox**           | Firecracker microVMs   | Memory snapshots for instant boot                                                 | Sub-second  |

### Category B — Containers / gVisor (image-only snapshots)

| Provider              | Isolation                | Notes                                                                                                              |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Daytona** (current) | Docker containers + DinD | Image-only snapshots; running state snapshotting is open feature request #2519                                     |
| **Modal**             | gVisor containers        | Memory snapshots capture init state (imports, globals) only — restore creates new sandbox, not live process resume |
| **Northflank**        | Kata microVM + gVisor    | Kata gives kernel-level isolation but no running-state snapshot emphasis                                           |

## Pricing comparison

Normalized to **4 vCPU + 8 GB RAM + 10 GB storage**.

| Provider                 | $/hour (active)                         | $/month 24/7                        | Running-state snapshot?   | Notes                                                                                            |
| ------------------------ | --------------------------------------- | ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| **Freestyle**            | ~$0.266                                 | ~$192                               | Yes                       | $0.04032×4 + $0.01294×8 + $0.000086×10                                                           |
| **Morph Cloud**          | ~$0.20 – $0.33                          | ~$144 – $240                        | Yes                       | MCU model (1 MCU = 1 vCPU-hr + 4 GB + 16 GB disk @ $0.05); pricing model ambiguous — get a quote |
| **E2B**                  | ~$0.331                                 | ~$238                               | Yes                       | $0.000014/s × 4 + $0.0000045/s × 8 × 3600; storage free up to 20 GiB                             |
| **Daytona**              | ~$0.332                                 | ~$239                               | **No**                    | $0.0504×4 + $0.0162×8 + $0.000108×10                                                             |
| **Blaxel M** (8 GB tier) | ~$0.332 active / **~$0.003 standby**    | ~$26 if mostly idle / ~$239 if 24/7 | Yes                       | M tier $0.000092/s × 3600; standby snapshot storage is negligible                                |
| **Vercel Sandbox** (Pro) | ~$0.683 (only when CPU active, not I/O) | ~$492 (24/7, 100% CPU)              | Yes                       | $0.128×4 + $0.0212×8; I/O wait is free — could be much cheaper in practice                       |
| **Modal Sandbox**        | ~$0.760                                 | ~$547                               | Partial (init state only) | $0.142×4 + $0.024×8                                                                              |

### Price breakdown used

- **Daytona**: $0.0504/vCPU-hr, $0.0162/GiB-hr RAM, $0.000108/GiB-hr storage
- **E2B**: $0.000014/s per vCPU, $0.0000045/GiB/s RAM (same as Daytona when normalized), 20 GiB storage free on Pro
- **Freestyle**: $0.04032/vCPU-hr, $0.01294/GiB-hr RAM, $0.000086/GiB-hr storage; free tier: 20 vCPU-hr/day
- **Morph Cloud**: 1 MCU = $0.05, bundle = 1 vCPU + 4 GB RAM + 16 GB disk OR 5 TB snapshot storage
- **Blaxel**: tier-based by RAM — XS (2GB) $0.0828/hr, S (4GB) $0.166/hr, **M (8GB) $0.331/hr**, L (16GB) $0.662/hr, XL (32GB) $1.325/hr; standby snapshot $0.000278/GB/hr
- **Vercel Sandbox** (Pro): $0.128/vCPU-hr active CPU, $0.0212/GiB-hr memory, $0.08/GB-month storage
- **Modal Sandbox**: $0.142/core-hr, $0.024/GiB-hr RAM

## Recommendations

For solving the Supabase startup problem + keeping costs reasonable:

### 🥇 Best fit: Blaxel (M tier)

- Same active price as Daytona (~$0.332/hr)
- Standby is effectively free — if agent tasks are mostly idle between steps, monthly bill could be ~$26 vs $239
- 25ms resume from full memory+fs snapshot including running processes
- Perfect for bursty agent workloads: kick off a task, work, wait for input, standby, resume instantly

### 🥈 Cheapest overall: Freestyle

- ~20% cheaper than Daytona (~$192/month vs $239)
- Real VM isolation with memory snapshots
- Generous free tier (20 vCPU-hrs/day — many jobs may be free)
- <100ms resume

### 🥉 If you want cheapest active rate: Morph Cloud

- Best-case $144/month (max-dim MCU model); worst-case $240/month (sum-dim)
- Infinibranch lets you fork a live seeded+running Supabase environment to N sandboxes in <250ms
- Pricing model is ambiguous — need to get a quote

### Don't move to:

- **Vercel Sandbox**: ~2× the price, 45min runtime limit on Hobby
- **Modal Sandbox**: ~2.3× the price, memory snapshots are for ML model init, not arbitrary running processes
- **Stay on Daytona**: if `start-db` + `seed:sql` total < 30–60s, the migration isn't worth it. Just bake Docker images into the snapshot to shave off image pulls.

## Sources

- [Daytona Snapshots docs](https://www.daytona.io/docs/en/snapshots/)
- [Daytona Architecture](https://www.daytona.io/docs/en/architecture/)
- [Daytona Volumes](https://www.daytona.io/docs/en/volumes/)
- [Daytona Declarative Builder](https://www.daytona.io/docs/en/declarative-builder/)
- [Daytona issue #2519 — Running Sandbox Snapshotting](https://github.com/daytonaio/daytona/issues/2519)
- [Daytona pricing](https://www.daytona.io/pricing)
- [E2B persistence docs](https://e2b.dev/docs/sandbox/persistence)
- [E2B pricing](https://e2b.dev/pricing)
- [Modal memory snapshots](https://modal.com/docs/guide/memory-snapshot)
- [Modal pricing](https://modal.com/pricing)
- [Morph Cloud snapshots](https://cloud.morph.so/docs/documentation/snapshots)
- [Morph Cloud developers](https://cloud.morph.so/docs/developers)
- [Morph Cloud pricing](https://cloud.morph.so/pricing)
- [Blaxel Sandbox](https://blaxel.ai/sandbox)
- [Blaxel pricing](https://blaxel.ai/pricing)
- [Vercel Sandbox docs](https://vercel.com/docs/vercel-sandbox)
- [Vercel Sandbox pricing](https://vercel.com/docs/vercel-sandbox/pricing)
- [Freestyle pricing](https://www.freestyle.sh/pricing)
- [Firecracker snapshotting](https://github.com/firecracker-microvm/firecracker/blob/main/docs/snapshotting/snapshot-support.md)
- [Northflank — best code execution sandbox for AI agents in 2026](https://northflank.com/blog/best-code-execution-sandbox-for-ai-agents)
- [Northflank — sandbox providers 2026](https://northflank.com/blog/sandbox-providers)
- [Northflank — Daytona vs E2B](https://northflank.com/blog/daytona-vs-e2b-ai-code-execution-sandboxes)
- [Superagent — AI Code Sandbox Benchmark 2026](https://www.superagent.sh/blog/ai-code-sandbox-benchmark-2026)
