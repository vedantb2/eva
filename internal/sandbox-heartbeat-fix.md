# Sandbox Heartbeat Fix: JWT to HMAC Migration

**Date**: 2026-03-07
**Status**: Implemented

## The Problem

All quick task runs were being killed by the watchdog with:

```
Run killed by watchdog: no heartbeat for 180s
```

Running 2 quick tasks (each with 1 auto-retry) produced 4 consecutive failures — 100% failure rate.

## Investigation

### How the heartbeat works

1. When a task run starts, `updateRunToRunning` creates a `streamingActivity` record with `lastUpdatedAt = now` and schedules a watchdog check after 90s.
2. The sandbox callback script (`callbackScript.ts`) sends heartbeats every 10s by calling `streaming:set` via HTTP POST to `/api/mutation`.
3. The watchdog (`checkStaleRuns`) checks `streamingActivity.lastUpdatedAt`. If it's older than 180s (`STALE_THRESHOLD_MS`), the run is killed.

### The auth chain for every heartbeat

`streaming:set` is an `authMutation`. Every single heartbeat call requires:

1. HTTP request hits Convex `/api/mutation`
2. Convex platform parses and validates the sandbox JWT (signature, expiry, issuer, audience)
3. Convex resolves identity, makes `ctx.auth.getUserIdentity()` available
4. `authMutation` wrapper calls `getCurrentUserId()` which queries the `users` table by clerkId
5. Only then does the actual streaming update execute

If **any** step in this chain fails, the mutation throws "Not authenticated" and the heartbeat is dropped.

### The silent failure

The callback script's heartbeat had a bare `catch {}`:

```js
async function heartbeatPing() {
  try {
    await callMutation("streaming:set", { ... });
    lastStreamingSentAt = Date.now();
  } catch {} // ALL errors silently eaten
}
```

When heartbeats fail, there's zero visibility. The same applied to `flushStreaming`.

### Confirming the root cause

The Convex logs showed `presence:disconnect` (also an `authMutation`) throwing "Not authenticated" every ~10 seconds continuously:

```
22:28:43 presence:disconnect  Uncaught Error: Not authenticated
22:29:37 presence:disconnect  Uncaught Error: Not authenticated
22:29:53 presence:disconnect  Uncaught Error: Not authenticated
22:30:06 presence:disconnect  Uncaught Error: Not authenticated
22:30:18 presence:disconnect  Uncaught Error: Not authenticated
... (continued every ~10s)
```

This confirmed that Convex's auth layer intermittently fails to validate JWTs. The same mechanism was killing sandbox heartbeats — the sandbox JWT was being rejected by the auth layer, heartbeats silently failed for 180s, and the watchdog killed the run.

### Why 4 failures

The retry logic in `maybeScheduleQuickTaskRetry` allows exactly 1 auto-retry per task (it checks if the previous run had `exitReason: "auto_retry_scheduled"`). So: 2 tasks x (1 initial + 1 retry) = 4 runs, all hitting the same systematic auth issue.

## Solution: HMAC-Authenticated Streaming Endpoint

### Design

Replace JWT auth with HMAC for streaming heartbeats. HMAC is deterministic — if the key and entityId are the same, the result is always the same. No transient failures possible.

**At launch time** (server-side Node.js action):

- Compute `HMAC-SHA256(ENCRYPTION_KEY, streamingEntityId)` using Node.js `crypto`
- Pass the HMAC + Convex site URL to the sandbox as env vars

**At heartbeat time** (sandbox callback script):

- POST to `/api/streaming/heartbeat` with `{entityId, hmac, currentActivity}`
- No JWT token needed

**At validation time** (Convex HTTP action handler):

- Read `ENCRYPTION_KEY` from env vars
- Recompute `HMAC-SHA256(ENCRYPTION_KEY, entityId)` using Web Crypto API
- Compare with provided HMAC
- If match, call `internal.streaming.internalSet` directly

### Security properties

- The HMAC is scoped to a single streaming entityId — can't write to other entities
- Unforgeable without `ENCRYPTION_KEY` (Convex env var, never exposed to sandbox)
- Prompt injection can't abuse it — even if Claude in the sandbox is manipulated, the HMAC only authorizes updates to that run's streaming activity
- No secrets stored in the database

### Why not other approaches

| Approach                 | Verdict                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| Fix JWT to not fail      | Can't control Convex platform's auth validation layer                    |
| Skip auth entirely       | Prompt injection risk — sandbox code could write to any streaming entity |
| Store random token in DB | Puts secrets in the database                                             |
| Deploy key auth          | Single shared secret authorizes ALL mutations, not scoped                |
| HMAC via HTTP endpoint   | Deterministic, scoped, no storage, no JWT dependency                     |

## Files Changed

### `packages/backend/convex/http.ts`

- Added `computeStreamingHmac()` using Web Crypto API
- Added `POST /api/streaming/heartbeat` HTTP route with HMAC validation
- Calls `internal.streaming.internalSet` on success — bypasses entire auth chain

### `packages/backend/convex/_daytona/helpers.ts`

- Added `computeStreamingHmac()` using Node.js `crypto.createHmac`
- Updated `signAndLaunchScript()` to compute HMAC for the streaming entityId
- Passes `STREAMING_HMAC` and `CONVEX_SITE_URL` env vars to the sandbox

### `packages/backend/convex/_daytona/callbackScript.ts`

- Added `callStreamingHeartbeat()` function that calls the HMAC HTTP endpoint
- Falls back to old `streaming:set` authMutation if HMAC env vars not set
- Migrated all 5 streaming write call sites to use `callStreamingHeartbeat()`
- Added retry (1 retry) and error logging to heartbeat/flush paths
- Added `consecutiveHeartbeatFailures` counter for observability

### `packages/backend/convex/auth.ts`

- Added missing `customTheme` field to `getUserByClerkId` return validator (separate bug causing `ReturnsValidationError`)

## HMAC Consistency

Both sides must produce identical HMACs. They use the same approach:

- **Key material**: The raw hex string from `ENCRYPTION_KEY`, encoded as UTF-8 bytes
- **Message**: The streaming entityId string (e.g. `task-run-${runId}`), encoded as UTF-8
- **Algorithm**: HMAC-SHA256
- **Output**: Lowercase hex string

Node.js (`helpers.ts`):

```js
createHmac("sha256", secret).update(entityId).digest("hex");
```

Web Crypto (`http.ts`):

```js
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(entityId));
// Convert ArrayBuffer to hex string
```

Both treat the ENCRYPTION_KEY hex string as raw UTF-8 key material (not hex-decoded), ensuring identical results.

===================================================

Let me be precise about what we're solving and whether HMAC actually solves it.  
 The current auth chain for heartbeats (JWT): 1. HTTP request hits Convex /api/mutation  
 2. Convex platform validates JWT (signature, expiry, issuer, audience) 3. Convex resolves identity → makes ctx.auth.getUserIdentity() available 4. authMutation calls getCurrentUserId() → queries users table by clerkId 5. If ANY step fails → "Not authenticated" → heartbeat dropped The HMAC auth chain: 1. HTTP request hits Convex HTTP route /api/streaming/heartbeat  
 2. Our code reads ENCRYPTION_KEY from env var 3. Computes HMAC(key, entityId) → compares with provided HMAC 4. If match → calls internalSet directly (no auth layer involved)

Will HMAC eliminate the auth issue? Yes, because:

- No JWT parsing/validation (Convex platform's auth layer is completely bypassed)
- No user identity resolution
- No database lookup for the user
- Only a deterministic hash comparison — if the key and entityId are the same, the HMAC is the same. No
  transient failures possible.

Other solutions I considered:

Approach: HMAC via HTTP route
Pros: No JWT, no DB lookup, deterministic, zero transient failures
Cons: New HTTP endpoint, slightly more latency (HTTP action → mutation)
────────────────────────────────────────
Approach: Store random token in DB
Pros: Simple, no crypto needed
Cons: Token in DB (you rejected this)
────────────────────────────────────────
Approach: Skip auth entirely
Pros: Simplest
Cons: Prompt injection risk (you rejected this)
────────────────────────────────────────
Approach: Fix JWT to not fail
Pros: No code changes
Cons: Can't control Convex platform's JWT validation layer
────────────────────────────────────────
Approach: Use internalMutation via HTTP
Pros: Direct DB access
Cons: Can't call internal mutations from HTTP (they're only for server-side calls) — wait, actually  
 HTTP
actions CAN call internal mutations via ctx.runMutation. That's what the HMAC approach does.
────────────────────────────────────────
Approach: Deploy key auth
Pros: Already exists (EVA_DEPLOY_KEY)
Cons: A single shared secret that authorizes ALL mutations, not scoped to one entityId

The one risk with HMAC: if ENCRYPTION_KEY env var is missing, the HTTP endpoint returns 500. But this  
 is a deployment config issue, not a transient failure.

HMAC is the right solution here. It's the same pattern already used for GitHub webhook verification in
