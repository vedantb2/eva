# Convex prod → dev sync script

**Status:** implemented — verification pending

## Follow-up

- **Run once and confirm**: `pnpm --filter @eva/backend run sync:prod-to-dev` (needs `convex login`). Check `packages/backend/backups/prod-*.zip`, dashboard table counts on `dev:good-mule-506` vs prod, a file-storage-backed record resolves, and that deployment's env vars are unchanged.

## What shipped

- `packages/backend/scripts/sync-prod-to-dev.mjs` — export prod (+ file storage) → import `--replace-all` into hardcoded `dev:good-mule-506`
- `pnpm --filter @eva/backend run sync:prod-to-dev`
- `packages/backend/backups/` gitignored
