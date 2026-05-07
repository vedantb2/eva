# Incident: Daytona snapshot builds failing on `pnpm install --frozen-lockfile`

**Date:** 2026-05-07
**Severity:** All snapshot builds for repos without a pinned `packageManager` field were failing.
**Status:** Resolved.
**Affected:** `evalucom/carepulse-ts` (first reported); any repo built off the snapshot Dockerfile that does not declare `packageManager` in its `package.json`.

## Symptom

Every fresh Daytona snapshot build failed at the `pnpm install --frozen-lockfile` layer with:

```
unprocessable entity: process "/bin/sh -c pnpm install --frozen-lockfile"
did not complete successfully: exit code: 1
```

BuildKit-cached layers were unaffected — the failure was on the uncached `pnpm install` layer, so any repo with a fresh build attempt would hit it.

## Why it was hard to diagnose

The `snapshotBuilds.logs` field in Convex contained only polling status (`[Poll N] Snapshot state: building...`), never the actual Docker build output. Every failed build had an empty log body, leaving us with only Daytona's terse top-line error.

Cause: `pollSnapshotProgress` in `snapshotActions.ts` fetched the build-logs URL from Daytona, then fetched the returned signed URL **without an Authorization header**. The signed URL returns `401 Unauthorized` without auth, and the surrounding `try/catch {}` silently swallowed the failure.

Once Bearer auth was added on the signed-URL fetch, the full BuildKit log surfaced:

```
! Corepack is about to download https://registry.npmjs.org/pnpm/-/pnpm-11.0.8.tgz
warn: This version of pnpm requires at least Node.js v22.13
warn: The current version of Node.js is v20.20.2

Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite
    at ../store/index/lib/index.js (.../corepack/v1/pnpm/11.0.8/dist/pnpm.mjs:16044:25)
```

## Root cause

The snapshot Dockerfile uses `node:20-bookworm` (Node 20.20.2) and runs `corepack enable` to set up package-manager shims. `corepack enable` does not install a specific pnpm version — it creates shims that download pnpm lazily on first invocation.

When the target repo has no `packageManager` field in `package.json`, corepack downloads whatever npm currently tags as `latest`. On 2026-05-07 at 06:31 UTC, npm's `latest` for pnpm became **v11.0.8**.

pnpm v11 was rewritten with a SQLite-backed package store (one `index.db` file). The authors chose to use Node's built-in `node:sqlite` module rather than pull in `better-sqlite3`. That builtin only exists in Node 22.5+ and was only made non-experimental in 22.13. On Node 20, `require('node:sqlite')` throws `ERR_UNKNOWN_BUILTIN_MODULE` before pnpm can do anything else.

Builds 24 hours earlier worked because pnpm 10.x was still tagged `latest`. Nothing in our codebase or in the target repo changed — the breaking change came from npm's `latest` tag flipping.

## Fix

Two changes in `packages/backend/convex/snapshotActions.ts`:

### 1. Pin pnpm to a Node-20-compatible version

Added one line after `USER eva`:

```ts
"corepack prepare pnpm@10.33.4 --activate",
```

`10.33.4` is the latest 10.x stable (`engines.node >= 18.12`). `--activate` records it as eva's "Last Known Good" version, so corepack uses it instead of fetching `latest` when no `packageManager` field is set. Repos that _do_ set a `packageManager` field still win — corepack always honors that field first.

### 2. Bearer auth on build-logs URL fetch

The signed log URL returned by `/snapshots/:id/build-logs-url` requires `Authorization: Bearer ${DAYTONA_API_KEY}` (verified empirically: 401 without, 200 with). Without this, every failed build had empty logs. With it, the full BuildKit output is now persisted on `snapshotBuilds.logs` (~180KB per build).

## Verification

Triggered a fresh build (`rn709d4cajyfe9pdnhntnv36fn8695ep`) against prod after deploy. Build went past the prior failure point (~60 s in), completed `pnpm install --frozen-lockfile`, ran postinstall scripts, and reached terminal state `success`. The `logs` field on this build contains the full layer-by-layer BuildKit output, confirming both fixes work end-to-end.

## Follow-ups

- **Other repos** using this snapshot template are protected by fix #1 too — anyone without a `packageManager` field would have hit the same bug.
- **User-set `packageManager: pnpm@11.x`**: corepack honors that field over our global pin. If any team adopts pnpm 11 in their repo, builds will fail again — this forces a Node 22 base-image bump.
- **Silent log-swallow pattern**: `try { ... } catch {}` exists elsewhere in `snapshotActions.ts` and similar files. Worth auditing if more silent failures show up.
- **Node 22 base image**: deferred. Pinning pnpm 10.x is the minimum-blast-radius fix. A Node 22 bump invalidates every BuildKit cache layer, may break native modules in user repos compiled against Node 20's ABI (better-sqlite3, node-pty, sharp), and means re-validating Chrome, code-server, supabase CLI, and the agent CLIs on a new runtime. Plan it as its own project.

## Sources

- pnpm v11.0.8 engines: `curl -s https://registry.npmjs.org/pnpm/11.0.8 | jq .engines` → `{"node":">=22.13"}`
- pnpm v11.0.0 release notes: https://github.com/pnpm/pnpm/releases/tag/v11.0.0 — "Node.js 22+ required — support for Node 18, 19, 20, and 21 is dropped." Describes the new SQLite-backed store.
- `node:sqlite` history: https://nodejs.org/api/sqlite.html — added in v22.5.0, flag-removed in v22.13.0/v23.4.0, current stability "1.2 — Release candidate."
- Corepack `latest` fallback behavior: https://github.com/nodejs/corepack — when no `packageManager` field is set, "Corepack queries the npm registry for the latest version and caches it for future use."
- pnpm publish times (npm registry): v11.0.0 published 2026-04-28T09:34Z, v11.0.8 published 2026-05-07T06:31Z. v10.33.4 published 2026-05-06T13:17Z.
- Daytona signed-URL Bearer requirement: empirical from prod testing (no other docs found).
