# Self-Signed Sandbox JWTs

## Problem

Sandboxes are external processes (Daytona) that call back to Convex via HTTP (`/api/mutation`, `/api/action`). They need a real JWT in the `Authorization: Bearer` header that Convex's auth layer can validate.

Previously, the frontend obtained a Clerk JWT and threaded it through:
frontend → public mutation → workflow → daytona action → sandbox env var `CONVEX_TOKEN`

This had two issues:

1. **Scheduled tasks had no token** — `executeScheduledTask` is an `internalMutation` triggered by the scheduler with no frontend user session. It passed `convexToken: ""`, meaning sandbox callbacks that needed auth (like `streaming:set`, `screenshots:attachMedia`) would fail silently.
2. **Token expiry** — Clerk JWT was set to 1 hour. Tasks running longer than that would fail mid-execution.

## Why not just pass userId or use internalAction?

The sandbox is **outside** Convex — it's a remote Daytona container making HTTP requests to Convex's public API. There's no way to call `internalAction`/`internalMutation` from the sandbox. A raw `userId` string is useless — the sandbox needs an actual JWT that Convex's auth middleware will accept and resolve to a user identity.

## Solution

The backend mints its own 24h JWTs signed with an EC P-256 key pair we control:

- `sandboxJwt.ts:signSandboxToken` — takes a `userId`, looks up the `clerkId`, signs a JWT with `sub: clerkId`
- `auth.config.ts` — second auth provider pointing at `CONVEX_SITE_URL` so Convex validates both Clerk JWTs (frontend) and our self-signed JWTs (sandbox)
- `http.ts` — `GET /.well-known/jwks.json` serves the public key so Convex can verify signatures

The JWT uses `sub: clerkId` because `getCurrentUserId` in `auth.ts` resolves `identity.subject` via the `by_clerk_id` index. The issuer is `CONVEX_SITE_URL` and audience is `"convex"` — matching the auth config.

## Deploy key coexistence

The sandbox callback script has two auth paths:

- `CONVEX_TOKEN` (Bearer JWT) — for `callMutation` / `callAction` (now a 24h self-signed JWT)
- `DEPLOY_KEY` — for HTTP endpoint callbacks like `/api/sandbox/task-completion`

Both coexist. The deploy key path was not changed.

## Env vars required

- `SANDBOX_JWT_PRIVATE_KEY` — EC P-256 private key as JWK JSON
- `SANDBOX_JWT_JWKS` — JWKS JSON containing the public key

Generate with: `cd packages/backend && node generate-sandbox-jwt-keys.mjs`

## Key rotation (future)

Not needed now. When needed: add a second `kid` to JWKS, sign new tokens with the new key, remove the old `kid` after 24h.

# Phase 2: Self-Signed Sandbox JWTs

## Context

Frontend generates Clerk JWTs (~5 min expiry) → threads them through workflow → sandbox env var. Long sandbox tasks fail when the JWT expires mid-execution. Solution: generate our own long-lived JWTs on the backend, signed with a private key we control. Convex validates them via a JWKS endpoint we serve. The sandbox uses these JWTs transparently — no callback script changes, no HTTP endpoint wrappers.

---

## Pre-requisite: Generate EC P-256 Key Pair

Run this Node.js snippet locally once:

```js
const { generateKeyPair, exportJWK } = require("jose");
(async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const pub = await exportJWK(publicKey);
  pub.kid = "sandbox-1";
  pub.alg = "ES256";
  pub.use = "sig";
  const priv = await exportJWK(privateKey);
  priv.kid = "sandbox-1";
  priv.alg = "ES256";
  console.log("SANDBOX_JWT_PRIVATE_KEY:", JSON.stringify(priv));
  console.log("SANDBOX_JWT_JWKS:", JSON.stringify({ keys: [pub] }));
})();
```

Set both values as Convex env vars on dashboard before deploying.

---

## Implementation

### Step 1: Add `jose` dependency

**File**: `packages/backend/package.json`

- Add `"jose": "^6.0.11"` to dependencies
- Run `pnpm install`

### Step 2: New file `convex/sandboxJwt.ts` (`"use node"`)

Single exported internal action: `signSandboxToken`

- Args: `userId: v.id("users")`
- Look up user's `clerkId` via `ctx.runQuery(internal.auth.getUserByClerkId)` — wait, we need the reverse: given userId, get clerkId. Use a new internalQuery or just look up user doc directly.
- Actually — `signSandboxToken` is a `"use node"` action, so it can't do `ctx.db.get()`. It needs to call an internalQuery to get the user's clerkId.
- Existing: `auth.ts:getUserByClerkId` takes clerkId → returns user. We need the reverse: userId → clerkId. Add `getUserClerkId` internalQuery to `auth.ts`.

**Logic**:

```
1. clerkId = await ctx.runQuery(internal.auth.getUserClerkId, { userId })
2. privateKeyJwk = JSON.parse(process.env.SANDBOX_JWT_PRIVATE_KEY)
3. key = await importJWK(privateKeyJwk, "ES256")
4. jwt = await new SignJWT({ sub: clerkId })
     .setProtectedHeader({ alg: "ES256", kid: privateKeyJwk.kid })
     .setIssuer(process.env.CONVEX_SITE_URL)
     .setAudience("convex")
     .setExpirationTime("24h")
     .setIssuedAt()
     .sign(key)
5. return jwt
```

Key detail: `sub: clerkId` because `getCurrentUserId` in `auth.ts` resolves `identity.subject` via the `by_clerk_id` index. The issuer must match the domain in `auth.config.ts`. The audience "convex" must match `applicationID`.

### Step 3: Add `getUserClerkId` to `auth.ts`

**File**: `packages/backend/convex/auth.ts`

```ts
export const getUserClerkId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.clerkId ?? null;
  },
});
```

### Step 4: Add JWKS endpoint to `http.ts`

**File**: `packages/backend/convex/http.ts`

Add route:

```
GET /.well-known/jwks.json → returns JSON.parse(process.env.SANDBOX_JWT_JWKS)
```

No auth needed — JWKS is public by design (contains only public key).

### Step 5: Add second auth provider to `auth.config.ts`

**File**: `packages/backend/convex/auth.config.ts`

```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
```

Convex will try both providers when validating JWTs. Clerk JWTs match the first, sandbox JWTs match the second.

### Step 6: Modify daytona.ts — generate JWT inside `setupAndExecute` etc.

**File**: `packages/backend/convex/daytona.ts`

For each of these 4 internalActions, replace `convexToken: v.string()` with `userId: v.id("users")`:

- `setupAndExecute`
- `launchOnExistingSandbox`
- `launchAudit`
- `runSessionAudit`

Inside each handler, before calling `launchScript`:

```ts
const sandboxToken = await ctx.runAction(internal.sandboxJwt.signSandboxToken, {
  userId: args.userId,
});
```

Then pass `sandboxToken` as the `convexToken` arg to `launchScript`.

`launchScript` itself does NOT change — it still takes a `convexToken` string param and sets `CONVEX_TOKEN` env var in the sandbox.

### Step 7: Modify workflow definitions — replace `convexToken` with `userId`

Every workflow definition that currently has `convexToken: v.string()` in its args needs to change to `userId: v.id("users")`.

**Files** (workflow definition → daytona call):
| File | Workflow | Daytona function called |
|------|----------|------------------------|
| `sessionWorkflow.ts` | `sessionExecuteWorkflow` | `setupAndExecute` |
| `docInterviewWorkflow.ts` | `docInterviewWorkflow` | `setupAndExecute` |
| `docInterviewWorkflow.ts` | `docGenerateWorkflow` | `setupAndExecute` |
| `docPrdWorkflow.ts` | `docPrdWorkflow` | `setupAndExecute` |
| `evaluationWorkflow.ts` | `evaluationWorkflow` | `setupAndExecute` |
| `projectInterviewWorkflow.ts` | `projectInterviewWorkflow` | `setupAndExecute` |
| `projectInterviewWorkflow.ts` | `projectSpecWorkflow` | `setupAndExecute` |
| `researchQueryWorkflow.ts` | `generateQueryWorkflow` | `setupAndExecute` |
| `researchQueryWorkflow.ts` | `confirmQueryWorkflow` | `setupAndExecute` |
| `summarizeWorkflow.ts` | `summarizeSessionWorkflow` | `setupAndExecute` |
| `testGenWorkflow.ts` | `testGenWorkflow` | `setupAndExecute` |
| `taskWorkflow.ts` | `taskExecutionWorkflow` | `setupAndExecute` + `launchAudit` |
| `designWorkflow.ts` | `designSessionWorkflow` | `launchOnExistingSandbox` |
| `buildWorkflow.ts` | `buildProjectWorkflow` | indirect (calls `startTaskForBuild` → `taskExecutionWorkflow`) |
| `buildWorkflow.ts` | `startTaskForBuild` (internal) | passes to `taskExecutionWorkflow` |

Each workflow: change `convexToken: v.string()` → `userId: v.id("users")`, and forward `userId` instead of `convexToken` to the daytona function.

### Step 8: Modify public mutations — replace `convexToken` with passing `ctx.userId`

These are the `authMutation` entry points that start workflows. Remove `convexToken: v.string()` from args, pass `userId: ctx.userId` to `workflow.start()`.

**Files** (public mutation name):
| File | Mutation |
|------|---------|
| `sessionWorkflow.ts` | `startExecute` |
| `docInterviewWorkflow.ts` | `startInterview`, `startGenerate` |
| `docPrdWorkflow.ts` | `startPrdParse` |
| `evaluationWorkflow.ts` | `startEvaluation` |
| `projectInterviewWorkflow.ts` | `startInterview`, `startSpec` |
| `researchQueryWorkflow.ts` | `startGenerate`, `startConfirm` |
| `summarizeWorkflow.ts` | `startSummarize` |
| `testGenWorkflow.ts` | `startTestGen` |
| `taskWorkflow.ts` | `triggerExecution` |
| `buildWorkflow.ts` | `startBuild` |
| `designSessions.ts` | `executeMessage` |
| `sessionAudits.ts` | `startAudit` |

Also: `taskWorkflow.ts:executeScheduledTask` (internalMutation) currently hardcodes `convexToken: ""`. Change to pass `userId` from the task's `createdBy` or `assignedTo` field.

### Step 9: Remove `convexToken` from frontend

**Delete**: `apps/web/lib/hooks/useConvexToken.ts`

**14 web files** — remove `convexToken` from mutation calls and all `getConvexToken()` / `useConvexToken()` usage:

1. `app/(main)/[owner]/[repo]/sessions/[id]/ChatPanel.tsx`
2. `lib/components/tasks/TaskDetailModal.tsx`
3. `lib/components/quick-tasks/QuickTasksListView.tsx`
4. `lib/components/quick-tasks/QuickTasksKanbanBoard.tsx`
5. `lib/components/projects/ProjectTabs.tsx`
6. `app/(main)/[owner]/[repo]/projects/[projectId]/ProjectDetailClient.tsx`
7. `lib/components/sidebar/TestingArenaSidebar.tsx`
8. `lib/components/sidebar/DocsSidebar.tsx`
9. `app/(main)/[owner]/[repo]/design/[id]/DesignDetailClient.tsx`
10. `app/(main)/[owner]/[repo]/analyse/query/[id]/QueryDetailClient.tsx`
11. `app/(main)/[owner]/[repo]/testing-arena/[id]/page.tsx`
12. `lib/components/projects/ProjectChatTab.tsx`
13. `lib/components/docs/DocInterviewDialog.tsx`
14. `lib/components/docs/DocViewer.tsx`

**2 chrome extension files** — remove `convexToken` + `getToken({template:"convex"})` calls:

1. `apps/chrome-extension/src/sidepanel/App.tsx`
2. `apps/chrome-extension/src/sidepanel/components/ChatPanel.tsx`

### Step 10: Clean up unused import `mutation` in workflow files

Several workflow files import `mutation` from `_generated/server` but no longer use it (they only use `authMutation` from `./functions`). Remove unused imports from:

- `buildWorkflow.ts`, `designWorkflow.ts`, `docInterviewWorkflow.ts`, `docPrdWorkflow.ts`
- `evaluationWorkflow.ts`, `projectInterviewWorkflow.ts`, `researchQueryWorkflow.ts`
- `sessionWorkflow.ts`, `summarizeWorkflow.ts`, `testGenWorkflow.ts`

(These already show as TS6133 warnings in `npx tsc`.)

---

## Verification

1. `pnpm install` — jose installed
2. `npx convex dev` — all Convex functions compile
3. `npx tsc` in `apps/web` — no new type errors
4. `npx tsc` in `apps/chrome-extension` — no new type errors
5. Grep: no `convexToken` in frontend files or public mutation args
6. Manual test: trigger a session execute → sandbox should receive 24h JWT → streaming works → completion works
7. Manual test: trigger a task execution → same flow
8. Verify `/.well-known/jwks.json` returns valid JWKS (curl or browser)

---

## Unresolved

- **Key rotation**: Not needed now. When needed, add a second kid to JWKS, sign with new key, remove old kid after 24h.
