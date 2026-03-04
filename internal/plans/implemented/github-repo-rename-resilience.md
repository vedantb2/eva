# Fix: GitHub Repo/App Rename Resilience

## Context

When a GitHub repo is renamed (conductor → eva) or a monorepo app dir is renamed (apps/mcp-server → apps/mcp), the system creates duplicate `githubRepos` rows because `upsert` matches by `(owner, name, rootDirectory)`. Old rows linger, causing stale cards on the home page and broken API calls.

## Files to Modify

1. `packages/backend/convex/schema.ts` — add `githubId` field + index
2. `packages/backend/convex/githubRepos.ts` — update validator, `upsert`, `create`, `syncConnectedStatus`; add `cleanupStaleSubApps`
3. `packages/backend/convex/github.ts` — pass `repo.id` as `githubId` in `syncRepos`; pass detected app paths to cleanup
4. `packages/backend/convex/migrations.ts` — add `renameMcpServerToMcp` migration
5. `apps/web/app/(main)/setup/[id]/RepoSetupClient.tsx` — pass `githubId` to `create`
6. `apps/web/app/(main)/[owner]/[repo]/settings/monorepo/MonorepoClient.tsx` — pass `githubId` to `create`

## Changes

### 1. Schema — add `githubId` to `githubRepos`

- Add `githubId: v.optional(v.number())` field
- Add `.index("by_github_id", ["githubId"])` before existing indexes

### 2. `githubRepos.ts` — update validator

- Add `githubId: v.optional(v.number())` to `githubRepoValidator`

### 3. `githubRepos.ts` — update `upsert`

- Add `githubId: v.optional(v.number())` to args
- New matching logic:
  1. If `githubId` provided → query `by_github_id` index, find matching `rootDirectory`
  2. Fallback → current `by_owner_name` + `rootDirectory` matching
  3. If match found with different `owner`/`name` → patch them (rename detected)
  4. Backfill `githubId` on existing rows that lack it
  5. If no match → insert with `githubId`

### 4. `githubRepos.ts` — update `create`

- Add `githubId: v.optional(v.number())` to args
- Same `githubId`-first matching: if a row with same `githubId` + `rootDirectory` exists:
  - If `owner`/`name` differ → patch them (rename detected), return existing ID
  - If identical → throw "already exists"
- If no `githubId` match, fall back to current `owner+name+rootDirectory` duplicate check
  - If duplicate found AND `githubId` provided → backfill `githubId` on existing row before throwing
- Pass `githubId` through to `ctx.db.insert` on new rows

### 5. `github.ts` — pass `githubId` in `syncRepos`

- Both parent upsert (line ~323) and sub-app upsert (line ~339): add `githubId: repo.id`
- `repo.id` is already available from the GitHub API response

### 6. `syncConnectedStatus` — fix sub-app cascade logic

**Problem:** Current logic marks ALL sub-app rows as `connected: true` when parent is connected (via `connectedParents` check). Stale `apps/mcp-server` rows stay `connected: true`.

**Fix:** Remove the `connectedParents` cascade. Sub-app rows should only be `connected: true` if explicitly in `connectedIds`. Safe because `syncRepos` already adds both parent and sub-app IDs to `connectedIds`.

### 7. `githubRepos.ts` — add `cleanupStaleSubApps` internal mutation

Args: `detectedApps: v.array(v.object({ owner: v.string(), name: v.string(), paths: v.array(v.string()) }))`

For each repo in `detectedApps`:

- Get all sub-app rows for that `(owner, name)` with `rootDirectory`
- Find rows whose `rootDirectory` is NOT in detected `paths` AND `connected === false`
- **Guard: skip rows where `connectedBy` is defined** (user-created custom paths, not sync-created)
- For remaining candidates, check ALL tables with `repoId` + `by_repo` index: `sessions`, `projects`, `docs`, `researchQueries`, `savedQueries`, `routines`, `evaluationReports`, `designPersonas`, `designSessions`, `repoEnvVars`, `repoSnapshots`, `boards`
- If ANY table has a reference → skip (leave as disconnected)
- If no references → delete

Called from `syncRepos` after `syncConnectedStatus`. Build `detectedApps` array during the sync loop — include an entry for every synced repo even when `paths` is empty (so repos that lost all apps still get stale sub-app rows cleaned up).

### 8. Frontend — pass `githubId` to `create`

**`RepoSetupClient.tsx`:** `repo.id` available from `listRepos` → pass as `githubId`.

**`MonorepoClient.tsx`:** `repo.githubId` available from Convex doc (once schema updated) → pass to `createRepo()` when present.

### 9. Migration — `renameMcpServerToMcp`

For each `githubRepos` row where `rootDirectory === "apps/mcp-server"`:

- Check if target row exists with same `(owner, name)` + `rootDirectory === "apps/mcp"`
- **If target exists:**
  - Check if old row has references in any `by_repo`-indexed table
  - If references exist → re-point them to target row's ID, then delete old row
  - If no references → delete old row
- **If target doesn't exist:** patch `rootDirectory` to `"apps/mcp"`
- Return `{ updatedCount, deletedCount, referencesMovedCount }`

### 10. Schema — add `by_repo` indexes to `agentTasks` and `notifications`

- `agentTasks`: add `.index("by_repo", ["repoId"])` (repoId is optional, index still works)
- `notifications`: add `.index("by_repo", ["repoId"])` (repoId is optional, index still works)
- Required so `hasRepoReferences` can efficiently check these tables too

### 11. Shared helper — `hasRepoReferences` in new utility module

- Create `packages/backend/convex/repoUtils.ts`
- Export `hasRepoReferences(ctx, repoId: Id<"githubRepos">): Promise<boolean>` — checks ALL tables with `repoId` via `by_repo` indexes (sessions, projects, docs, researchQueries, savedQueries, routines, evaluationReports, designPersonas, designSessions, repoEnvVars, repoSnapshots, boards, agentTasks, notifications)
- Export `normalizePath(p: string): string | undefined` — `trim()` + strip leading/trailing `/`, returns `undefined` if result is empty (preserves root-vs-subapp distinction)
- Imported by both `githubRepos.ts` (cleanup) and `migrations.ts` (migration) to avoid logic drift

### 11. Normalize paths

- All `rootDirectory` comparisons (in `upsert`, `create`, `cleanupStaleSubApps`, migration) use `normalizePath` from `repoUtils.ts`
- Apply same normalization to detected app paths before comparison
- `normalizePath("")` → `undefined`, `normalizePath("apps/web")` → `"apps/web"`, `normalizePath("/apps/web/")` → `"apps/web"`
- Root repos keep `rootDirectory: undefined`, not `""`

## Verification

- `npx convex dev --once` to deploy
- Run `migrations:renameMcpServerToMcp` → verify `mcp-server` row gone, `mcp` row exists
- Trigger sync → verify:
  - All rows now have `githubId` populated
  - No duplicate rows for renamed repos
  - Stale sub-app rows (disconnected, sync-created, not in detected paths, no data) cleaned up
  - Custom user-added paths preserved (have `connectedBy`)
- Check home page: `mcp` card shows, `mcp-server` gone
- `npx tsc` in backend to verify types
