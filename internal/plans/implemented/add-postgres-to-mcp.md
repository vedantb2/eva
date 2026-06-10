# Add read-only Postgres support to the MCP

## Context

User has a Postgres read-replica URL and wants agents (via the eva MCP server) to run read-only SQL against it. The MCP server lives in `packages/backend/convex/mcp/` (`@modelcontextprotocol/sdk`, tools registered in `tools.ts`, Node logic in `"use node"` actions). Connection string stored per-repo via the existing Environment Variables UI under fixed key `POSTGRES_READ_REPLICA_URL` — no new UI. Read-only enforced via Postgres `READ ONLY` transaction + extended query protocol (no SQL parsing). Single `postgres_query` tool, `pg` driver.

## Decisions (confirmed with user)

- Conn string: per-repo env var, fixed key `POSTGRES_READ_REPLICA_URL`
- Read-only: `READ ONLY` transaction + statement_timeout (replica itself is final guarantee)
- Tool surface: single `postgres_query` tool (introspection via information_schema)
- Driver: `pg` (node-postgres), fresh `Client` per request, no pool
- No `environment` param — env vars are one flat list; replica is prod-data by nature
- No conn-string caching — dominant cost is TCP/TLS connect anyway
- Errors returned as data (discriminated union), not thrown — agent gets clean PG error text

## Changes

### 1. Deps — `packages/backend/package.json`

- `dependencies`: `"pg": "^8.x"` (latest); `devDependencies`: `"@types/pg"`
- `packages/backend/convex.json`: add `"pg"` to `node.externalPackages` (has optional dynamic `require("pg-native")` that trips esbuild; matches `jose`/`@daytonaio/sdk` pattern)
- `pnpm install` at repo root

### 2. New file — `packages/backend/convex/mcp/postgres.ts` (`"use node"`)

Internal action `runPostgresQuery` (keeps conn string inside the action — never crosses to tool layer/output):

- args: `{ repoId: v.string(), sql: v.string(), maxRows: v.number() }`
- returns: union of
  - `{ ok: v.literal(true), columns: v.array(v.string()), rows: v.array(v.any()), rowCount: v.number(), truncated: v.boolean() }`
  - `{ ok: v.literal(false), errorCode: v.union(v.literal("missing_config"), v.literal("query_error")), error: v.string() }`
  - (`v.any()` in Convex validators is fine — precedent: `queryTable`; the no-`any` rule is TS-level)

Handler:

1. `ctx.runAction(internal.mcp.routes.getDecryptedRepoEnvVars, { repoId })` → find `POSTGRES_READ_REPLICA_URL`; absent → `{ ok: false, errorCode: "missing_config" }`
2. `new Client({ connectionString, connectionTimeoutMillis: 10_000 })` — pass URL untouched; `pg` v8 honours `?sslmode=require` / `no-verify` in the string, no SSL code needed
3. Execution (try/finally cleanup on every path):
   - `SET default_transaction_read_only = on` (session-level)
   - `SET statement_timeout = 30000` (constant, not interpolated from input)
   - `BEGIN TRANSACTION READ ONLY`
   - `client.query({ text: sql, values: [] })` — **`values: []` forces extended query protocol, which rejects multi-statement SQL**, closing the `COMMIT; INSERT...` escape
   - finally: `ROLLBACK` (always — read-only), then `client.end()`
4. Shape result: `columns` from `result.fields`; slice rows to `maxRows`, set `truncated`; recursive `toJsonSafe` per cell (`Date → toISOString`, `Buffer → hex`, `bigint → String`, `undefined → null`, recurse arrays/objects); post-shape byte cap ~1 MB (drop tail rows, set `truncated`) to stay under Convex return limits
5. Catch → `{ ok: false, errorCode: "query_error", error: err instanceof Error ? err.message : String(err) }`

### 3. Tool registration — `packages/backend/convex/mcp/tools.ts`

- Extract access-check half of `resolveTargetWithAccess` ([tools.ts:60-94](packages/backend/convex/mcp/tools.ts:60), lines 66–78) into `assertRepoAccess(repoId, userId)`; `resolveTargetWithAccess` calls it. (Postgres tool needs access check but NOT Convex creds.)
- Register `postgres_query` after `count_table` (line 383), before task tools:
  - params: `sql: z.string()`, `limit: z.number().max(1000).default(100)`, `repoId: z.string()`
  - description: read-only, READ ONLY txn, 30s timeout, single statement only, use information_schema for discovery, add LIMIT
  - handler: `getContext()` → `assertRepoAccess` → `ctx.runAction(internal.mcp.postgres.runPostgresQuery, ...)` → on `missing_config` return `errorResult` telling user to add `POSTGRES_READ_REPLICA_URL` in repo Environment Variables settings (mention `?sslmode=` suffix and sandbox-exclude recommendation); on `query_error` return `errorResult` with PG message; else `textResult({ columns, rows, rowCount, truncated })`

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` — clean; no `any`/`unknown`/`as`/`!` in new TS
2. E2E (user runs dev): add `POSTGRES_READ_REPLICA_URL` to a repo via env vars UI, then via MCP client:
   - `SELECT 1 AS ok` → 1 row
   - `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` → schema discovery works
   - `INSERT INTO x ...` → "cannot execute INSERT in a read-only transaction"
   - `SELECT 1; SELECT 2` → multi-command rejection (extended protocol)
   - `SELECT pg_sleep(60)` → statement timeout error
   - repo without env var → missing-config guidance
   - `SELECT * FROM generate_series(1, 5000)` → 100 rows, `truncated: true`

## Ship

1. Checkout new branch (e.g. `feat/mcp-postgres-query`) before making changes
2. After verification passes: run `/changelog` to document the feature
3. Run `/ship` — commit, push branch, open PR to `main`

## Risks

- Replica must be publicly reachable (Convex egresses from AWS, no static IP) with TLS — recommend least-privilege read-only role on the conn string
- `pg` buffers full result before slicing — big `SELECT *` can spike memory; tool description tells agent to LIMIT (pg-cursor is later escape hatch)
- Recommend storing the env var with `sandboxExclude: true` so the replica URL never reaches task sandboxes

## Unresolved questions

None — all decisions confirmed.
