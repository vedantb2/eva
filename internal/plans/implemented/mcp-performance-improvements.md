# MCP Performance Improvements

## Context

The MCP server has several performance bottlenecks: Supabase tool discovery runs on every request (~1-3s), token resolution scans all repos without short-circuiting, and `listUserRepos` does a full table scan instead of using existing Convex indexes.

## Changes

### 1. Cache Supabase tool definitions (`supabase-proxy.ts`)

**Problem:** `registerSupabaseTools` connects to `mcp.supabase.com`, discovers tools, closes — on every single request.

**Fix:** Cache the discovered `Tool[]` array keyed by Supabase token with a TTL (10 min). On subsequent requests with the same token, skip discovery and register from cache.

- Add `const toolDefinitionCache = new Map<string, { tools: Tool[]; expiresAt: number }>()`
- In `registerSupabaseTools`, check cache before connecting. If hit, register tools from cache. If miss, connect + discover + cache + register.
- Add periodic sweep (60s interval) to evict expired entries, preventing unbounded growth on long-lived processes.

### 2. Short-circuit `resolveSupabaseToken` with error isolation (`supabase-proxy.ts`)

**Problem:** `Promise.allSettled` fetches env vars for ALL repos even if the first one has the token.

**Fix:** Sequential iteration with try/catch per repo — returns on first match, skips failed repos (preserving the fault tolerance of `allSettled`).

```
for (const repo of repos) {
  try {
    const vars = await getRepoEnvVars(...)
    const match = vars.find(v => v.key === "SUPABASE_ACCESS_TOKEN")
    if (match) {
      tokenCache.set(...)
      return match.value
    }
  } catch {
    continue
  }
}
```

### 3. Use indexed queries in `listUserRepos` (`convex-api.ts`)

**Problem:** Current query does `ctx.db.query("githubRepos").collect()` — loads ALL repos, filters in JS.

**Fix:** Replicate the index-based approach from `packages/backend/convex/_githubRepos/queries.ts:list()`:

1. Query `teamMembers` with `by_user` index → get user's teams
2. For each team, query `githubRepos` with `by_team` index
3. Query `githubRepos` with `by_connected_by` index for directly connected repos
4. Merge and deduplicate

**Important:** Do NOT copy the backend's `hidden` filtering. The current MCP `listUserRepos` returns all repos including hidden ones — keep that behavior.

Existing indexes confirmed in `packages/backend/convex/schema.ts:94-98`:

- `githubRepos.by_connected_by` on `connectedBy`
- `githubRepos.by_team` on `teamId`
- `teamMembers.by_user` on `userId`

### ~~4. Pool Supabase client connections~~ — DEFERRED

Codex correctly flagged that pooling a single Client per token assumes the MCP SDK transport is safe for overlapping concurrent `callTool()` calls. The SDK doesn't guarantee this. Implementing a mutex/queue adds complexity disproportionate to the gain, especially since #1 (caching tool definitions) already eliminates the most expensive per-request cost. Revisit if connection overhead is still a bottleneck after #1 ships.

## Files modified

- `apps/mcp/src/supabase-proxy.ts` — changes 1, 2
- `apps/mcp/src/convex-api.ts` — change 3

## Verification

- `cd apps/mcp && npx tsc --noEmit`
- Connect to the MCP via Claude, call `list_repos` (exercises #3), then call a `supabase_*` tool (exercises #1, #2)
- Second `supabase_*` call should be noticeably faster (cached tool definitions, no re-discovery)
