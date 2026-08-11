# Convex cloud → local sync script

**Status:** implemented — end-to-end run pending

## What shipped

- `packages/backend/scripts/sync-to-local.mjs` — export a cloud deployment (selected by deploy key, no `convex login`) → import `--replace-all` into the local backend addressed by `--url` + `--admin-key`
- `pnpm sync:prod-to-local` (root and `@eva/backend`)
- The same file in carepulse-ts as `scripts/sync-to-local.mjs` / `pnpm sync:staging-to-local`, with an app map for `apps/web` and `apps/eprocurement`

Flags: `--app`, `--deploy-key-file`, `--deploy-key`, `--include-storage`, `--include-env`, `--local-url`, `--local-admin-key`, `--keep-snapshot`.

## Verified

- Every guard refuses and changes nothing: no key, project key, non-loopback `--local-url`, half an override pair, unknown `--app`, no local deployment on disk, nothing listening on the target port.
- Windows argument quoting: an admin key containing `|` reaches the child process intact. Unquoted, `cmd.exe` reads it as a pipe and the command fails with `'…' is not recognized`. `sync-prod-to-dev.mjs` never hit this because it passes no keys on the command line.

## Follow-up

- **Run once end-to-end**: needs a prod deploy key from the dashboard and `npx convex dev` running in `packages/backend` while logged out. Check table counts against prod, then re-run with `--include-storage` and `--include-env`.
- **Components in snapshots is unconfirmed.** Convex documents neither including nor excluding component tables. eva uses `@convex-dev/migrations` and friends; carepulse uses rate-limiter, action-retrier, workflow and workpool. Check a component table's row count locally after the first import and record the answer in the script header. Scheduled functions are definitely not in a snapshot, so imported workflow or workpool rows can land orphaned.
