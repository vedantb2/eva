# Phase 1 spike — Managed Images (Ubuntu): findings so far

**Status: static findings complete; the live run is still blocked on
credentials. Phase 2 is implemented but gated — see "Phase 2 status" below.**

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
- Do **not** flip `VERCEL_SANDBOX_IMAGE` if `legacyAl2023SnapshotRestores` is
  false — that turns a library bump into a repo-by-repo re-seed.

## Phase 2 status — implemented, flip gated

Phase 2 is in the backend and is inert until you set one env var.

| Step                                    | State                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@vercel/sandbox` 2.4.0 → 3.0.0          | Done. No call-site changes needed, as the type audit above predicted.                             |
| `runtime` → `image` at create            | Done, behind `VERCEL_SANDBOX_IMAGE` (`convex/_sandbox/vercelImage.ts`). Unset ⇒ `runtime: "node24"`. |
| dnf → distro-neutral installs            | Done. Every install goes through `convex/_sandbox_runtime/packageManager.ts`; a contract test fails the build on a direct `dnf install` / `apt-get install`. |
| AL2023 workarounds dropped on Ubuntu     | Done, but kept for dnf: SPAL + libjack (ffmpeg), the gh yum repo, the Chrome `.repo` file, and the code-server `.rpm` all still run when the image is AL2023. |
| Re-seed every repo                       | **Not needed** — that was the fallback if AL2023 snapshots stopped restoring, which check 4 still has to confirm.  |

### Flipping it

```bash
# in the Convex deployment env, NOT a dev shell
VERCEL_SANDBOX_IMAGE=vercel/sandbox/universal:<pinned-tag>
```

Pin a tag rather than using `universal` bare: `latest` moves under you, and a
base-image change is exactly the kind of thing that should not arrive silently.
Unset the variable to roll back — no code change, no re-seed.

### Order of operations

1. Run this harness (checks 1-7, Q1, Q3) against a throwaway project.
2. If `legacyAl2023SnapshotRestores` is false, **stop** and re-plan; nothing
   below is safe.
3. Reconcile check 5's output against `PACKAGE_ALIASES` — it is the list of
   Ubuntu names this migration guessed from documentation, not from a live apt.
   Any name the harness reports as drifted needs a candidate added there.
4. Confirm `userIsUbuntu` / `legacyWorkdirStillExists`: eva hardcodes
   `/home/eva` and `/vercel/sandbox` in several modules (`EVA_ENV_FILE`, the
   seed's PATH setup, the VNC stack's `~/.vnc`). If the Ubuntu image differs,
   those need to move to `sandbox.cwd` before the flip, not after.
5. Set `VERCEL_SANDBOX_IMAGE` on one repo's deployment first and rebuild its
   seed; only then roll out.
