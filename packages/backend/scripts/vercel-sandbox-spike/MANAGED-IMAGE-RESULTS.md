# Phase 1 spike — Managed Images (Ubuntu): findings so far

**Status: partially answered. Static findings below are complete; the live run is
blocked on credentials.**

`managed-image-spike.mjs` needs `VERCEL_TOKEN` / `VERCEL_TEAM_ID` /
`VERCEL_PROJECT_ID`. Those live in the Convex deployment env, not in a dev
shell, so no live numbers were captured. Everything below comes from reading the
installed `@vercel/sandbox@3.0.0` type declarations — enough to answer two of
the three open questions and to de-risk the library bump.

## Answered without a live run (`@vercel/sandbox` 3.0.0 types)

| Question                              | Finding                                                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is `runtime` really still accepted?   | Yes. `RuntimeOrImage` is a union: `{ runtime?: RUNTIMES \| (string & {}); image?: never }` \| `{ runtime?: never; image?: SandboxImage }`. `runtime` is `@deprecated`, not removed. |
| Does the snapshot path change?        | **No.** The `source: { type: "snapshot", snapshotId }` variant forbids *both* `runtime` and `image`, exactly as in v2. eva's restore call compiles unchanged. |
| Default when neither is passed?       | `vercel/sandbox/universal:latest` — i.e. **Ubuntu, not AL2023**. eva must set `image` explicitly rather than relying on a default.                    |
| Valid managed image names             | `ManagedImage = "universal" \| "node:22" \| "node:24" \| "node:26" \| "python:3.14" \| "ubuntu" \| "arch"`, used as `` `vercel/sandbox/${ManagedImage}` ``. Note the **colon** (`node:24`, not `node24`). |
| Version/digest pinning                | `SandboxImage` widens to `(string & {})`, so `vercel/sandbox/universal:<tag>` and `...@sha256:...` both typecheck. No cast needed for a pinned tag.   |
| Q3 — `runCommand` semantics           | `RunCommandParams` is **unchanged**: `cmd`, `args`, `cwd`, `env`, `sudo`, `detached`, `stdout`, `stderr`, `signal`, `timeoutMs`. Detached + `getCommand(cmdId)`, `domain(port)`, `mkDir`, `writeFiles`, `snapshot`, `stop` all still exist with the same shapes. |
| v2.4.0 → v3.0.0 export surface        | **Additive only**: `SandboxUser`, `SandboxUserAlreadyExistsError`, `ExecutionContext`. Nothing eva imports was removed or renamed.                    |
| New in v3 worth knowing               | `Sandbox.fork()`, `Sandbox.getOrCreate()`, `createUser()` / `asUser()`. Not needed for this migration.                                               |
| Working directory                     | **Not settled by types.** `Sandbox.cwd` is documented as "e.g. `/vercel/sandbox`" and `writeFiles` still says relative paths land in `/vercel/sandbox` — suggestive, not authoritative for the Ubuntu image. Live check 2 must confirm. Note the SDK exposes `sandbox.cwd`, so eva can read the workdir instead of hardcoding it. |

**Implication:** the library bump itself (plan Phase 2 step 1) is low risk — no
breaking changes on any API eva uses. The risk is concentrated in the two
environment facts only a live run can settle: the container user/home and
whether AL2023 snapshots still restore.

## Still requires a live run

| #   | Check                                   | Blocked on |
| --- | --------------------------------------- | ---------- |
| 1   | Boot time vs `runtime: "node24"`         | creds      |
| 2   | `whoami` / `$HOME` / `/vercel/sandbox`   | creds      |
| 3   | Ubuntu snapshot round-trip               | creds      |
| 4   | **AL2023 snapshot restore under v3**     | creds      |
| 5   | `apt-get` toolchain + which hacks die    | creds      |
| 6   | IPv4-only networking                     | creds      |
| 7   | `ports` / per-port public URL            | creds      |
| Q1  | Preinstalled agent CLIs vs eva's own     | creds      |

The harness covers all of them in one command — see the README. It stops every
sandbox it creates on exit.

## Notes for whoever runs it

- Run it against a **throwaway** Vercel project, not eva prod: it creates
  sandboxes, snapshots them, and installs a Google apt repo.
- `SPIKE_SKIP_APT=1` gets checks 1-4, 6-7 in a couple of minutes; the apt stage
  is the slow part.
- Pass `SPIKE_LEGACY_SNAPSHOT_ID=snap_...` (a real eva seeded snapshot) to make
  check 4 conclusive for prod data rather than only for a snapshot the script
  created itself.
- Do **not** proceed to Phase 2 if `legacyAl2023SnapshotRestores` is false —
  that turns a library bump into a repo-by-repo re-seed.
