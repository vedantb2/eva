# Migrate MCP from Railway → Vercel

## Context

MCP server (`apps/mcp/`) on Railway as persistent Express process. Goal: consolidate onto Vercel.

## Current State — Already Partially Ready

- `vercel.json` exists with `"fluid": true`, 300s maxDuration, rewrites
- `api/index.ts` exists, exports Express app
- `index.ts` skips `app.listen()` when `process.env.VERCEL` set
- `StreamableHTTPServerTransport` (stateless HTTP) — ideal for serverless
- Each MCP tool call fully stateless: verify JWT → Convex REST → return

## Verdict: Yes, migrate — fix OAuth state problem first

## The Problem: In-Memory OAuth State

OAuth flow stores state in in-memory Maps that won't survive across serverless invocations:

| Store                 | Where             | Used By                                                 | TTL  |
| --------------------- | ----------------- | ------------------------------------------------------- | ---- |
| `clientStore` (Map)   | `auth.ts:31`      | `/oauth/register` → `/oauth/authorize` → `/oauth/token` | 24h  |
| `authCodeStore` (Map) | `auth.ts:23`      | `/oauth/authorize` (POST) → `/oauth/token`              | 5min |
| `cachedDeployKey`     | `convex-api.ts:6` | All MCP calls (perf cache, OK to lose)                  | 5min |
| `setInterval` cleanup | `auth.ts:36`      | Cleanup loop every 60s (unnecessary on serverless)      | N/A  |

**Flow that breaks:**

1. `POST /oauth/register` → stores client on instance A
2. `GET /oauth/authorize` → might hit instance B → **client not found → 400**

**What already works on serverless:** all MCP tool calls, deploy key cache, supabase caches

## Decisions

- **Vercel Pro** — 800s maxDuration
- **Convex tables** for OAuth state externalization (no new infra)

## Implementation Plan

### 1. Add Convex tables for OAuth state

**Files:** `packages/backend/convex/schema.ts`, new `packages/backend/convex/mcpOAuth.ts`

- `mcpAuthCodes` — `code` (indexed), `clerkUserId`, `codeChallenge`, `redirectUri`, `expiresAt`
- `mcpClientRegistrations` — `clientId` (indexed), `redirectUris`, `registeredAt`
- Mutations: `storeAuthCode`, `consumeAuthCode`, `registerClient`, `getClient`
- Cron job to clean expired entries (every 5 min)

### 2. Update MCP auth to use Convex instead of Maps

**File:** `apps/mcp/src/auth.ts`

- Remove `authCodeStore` Map, `clientStore` Map, `setInterval`
- Replace with fetch calls to Convex HTTP actions (same pattern as `convex-api.ts`)
- Add HTTP routes in `packages/backend/convex/http.ts` for OAuth state CRUD

### 3. Clean up caching

**File:** `apps/mcp/src/convex-api.ts`

- Keep `cachedDeployKey` as-is (perf-only, re-fetches on miss)
- Remove `setInterval` from `auth.ts`

### 4. Update Vercel config

**File:** `apps/mcp/vercel.json`

- Bump `maxDuration` to 800

### 5. Test on Vercel preview

- Full OAuth flow: register → authorize → token → MCP tool call
- Refresh token flow
- Internal token minting
- Cold start test (deploy, wait 10min, re-test OAuth)

### 6. Cut over

- Update `BASE_URL` env var to Vercel domain
- Remove `railway.toml`
- Decommission Railway service

## Verification

1. Full OAuth flow end-to-end from Claude Desktop
2. Token refresh after expiry
3. Cold start resilience (OAuth works after instance recycled)
4. All MCP tools return correct results
5. Internal token minting works
