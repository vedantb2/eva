# Migrate Next.js API Routes to Convex

## Context

3 API routes in `apps/web/app/api/`. Goal: move extension updates + terminal PTY to Convex. Agent login stays in Next.js (dev-only, Clerk-coupled).

---

## 1. Extension Updates → Convex HTTP routes (easy)

**Current:** `apps/web/app/api/updates/extension/route.ts`
No auth. Queries Convex via `ConvexHttpClient`, returns XML or 302 redirect. Pure middleman.

**Plan:**

- Add 2 HTTP routes in `packages/backend/convex/http.ts`:
  - `GET /api/updates/extension/updates.xml` — query `extensionReleases.getLatest`, return XML. Use `process.env.CONVEX_SITE_URL` for fallback CRX URL.
  - `GET /api/updates/extension/conductor.crx` — query same, 302 redirect to `crxUrl` or 404.
- Delete `apps/web/app/api/updates/extension/route.ts`
- Update `EXTENSION_UPDATE_URL` env var to point to `{CONVEX_SITE_URL}/api/updates/extension/updates.xml`
- Update `scripts/intune/README.md` references

**Files to modify:**

- `packages/backend/convex/http.ts` — add routes
- `apps/web/app/api/updates/extension/route.ts` — delete
- `scripts/intune/README.md` — update URL references

---

## 2. Terminal PTY → Convex actions (medium)

**Current:** `apps/web/app/api/sessions/terminal/route.ts`
Flow: Client → fetch Next.js → Clerk auth → ConvexHttpClient query → Daytona SDK → ConvexHttpClient mutation → return wsUrl.

**After:** Client → Convex action (native auth + direct DB + Daytona) → return wsUrl. Removes entire Next.js hop.

**Key finding:** `packages/backend/convex/daytona.ts` already imports `@daytonaio/sdk`, has `WORKSPACE_DIR`, `getDaytona()`, `resolveDaytonaApiKey()`. No new dependencies needed.

**Plan — create `packages/backend/convex/pty.ts`:**

Three `"use node"` actions:

1. **`connectPty`** (authAction)
   - Args: `sessionId: v.id("sessions")`, `cols: v.number()`, `rows: v.number()`
   - Get session via `ctx.runQuery(internal.sessions.getInternal, { id })`
   - Get sandbox via `resolveDaytonaApiKey(ctx, session.repoId)` + `getDaytona(apiKey).get(session.sandboxId)`
   - Create PTY: `sandbox.process.createPty(...)` → `handle.disconnect()`
   - If "already exists" error: kill + recreate
   - Build WebSocket URL (port the `getPtyWebSocketUrl` logic from `apps/web/lib/sandbox.ts`)
   - Update session: `ctx.runMutation(internal.sessions.updatePtySession, ...)`
   - Return `{ wsUrl, ptySessionId }`

2. **`resizePty`** (authAction)
   - Args: `sessionId: v.id("sessions")`, `cols: v.number()`, `rows: v.number()`
   - Get session, get sandbox, call `sandbox.process.resizePtySession(ptyId, cols, rows)`

3. **`disconnectPty`** (authAction)
   - Args: `sessionId: v.id("sessions")`
   - Get session, get sandbox, call `sandbox.process.killPtySession(ptyId)`
   - Clear ptySessionId: `ctx.runMutation(internal.sessions.updatePtySession, { id, ptySessionId: "" })`

**Frontend changes — `apps/web/app/(main)/[owner]/[repo]/sessions/[id]/TerminalPanel.tsx`:**

- Replace `fetch("/api/sessions/terminal?...")` with `useAction(api.pty.connectPty)`
- Replace `fetch("/api/sessions/terminal", { method: "POST", body: { action: "resize" } })` with `useAction(api.pty.resizePty)`
- Replace `fetch("/api/sessions/terminal", { method: "POST", body: { action: "disconnect" } })` with `useAction(api.pty.disconnectPty)`
- Since these are actions (not mutations), use `useAction` from `convex/react`

**Daytona API URL for WebSocket:** Port `getToolboxBaseUrl()` + `getPtyWebSocketUrl()` from `apps/web/lib/sandbox.ts` into `pty.ts`. Uses `DAYTONA_API_KEY` to fetch toolbox proxy URL + `sandbox.getPreviewLink(1)` for auth token.

**Files to modify:**

- `packages/backend/convex/pty.ts` — create (3 actions)
- `apps/web/app/(main)/[owner]/[repo]/sessions/[id]/TerminalPanel.tsx` — replace fetch with useAction
- `apps/web/app/api/sessions/terminal/route.ts` — delete
- `apps/web/lib/sandbox.ts` — delete (no other consumers)
- `apps/web/lib/convex-auth.ts` — check if still needed after removing terminal route

---

## 3. Agent Login — **Keep in Next.js** (no change)

Dev-only. Creates Clerk sign-in tokens. Redirects to Next.js origin. Zero benefit from moving.

---

## Verification

1. Extension: `curl {CONVEX_SITE_URL}/api/updates/extension/updates.xml` → valid XML
2. Terminal: open session → PTY connects, type commands, resize window, disconnect
3. `npx tsc` in both `apps/web` and `packages/backend`

## Unresolved questions

None — all decisions made.

---

## Implementation Notes (2026-03-02)

### What was done

- All changes match the plan above exactly.
- `pty.ts` uses `action()` (not `authAction` from convex-helpers) with manual `ctx.auth.getUserIdentity()` checks — required because `"use node"` actions don't support convex-helpers wrappers.
- Added `updatePtySessionInternal` (internalMutation) to `sessions.ts` since actions call via `ctx.runMutation` and can't use the auth-wrapped `updatePtySession`.
- Added `getLatestInternal` (internalQuery) to `extensionReleases.ts` since httpActions can only call internal functions.
- Handler return types explicitly annotated (`Promise<{ wsUrl: string; ptySessionId: string }>`, `Promise<null>`) to break circular type inference between `pty.ts` ↔ `_generated/api.d.ts`.
- `TerminalPanel.tsx` uses refs (`resizePtyRef`, `disconnectPtyRef`) for the resize observer and cleanup callbacks to avoid stale closures.
- `convex-auth.ts` and `sandbox.ts` deleted — only consumer was the terminal route.

### Files changed

- `packages/backend/convex/http.ts` — 2 new HTTP routes
- `packages/backend/convex/pty.ts` — new file, 3 actions
- `packages/backend/convex/extensionReleases.ts` — added `getLatestInternal`
- `packages/backend/convex/sessions.ts` — added `updatePtySessionInternal`
- `apps/web/app/(main)/[owner]/[repo]/sessions/[id]/TerminalPanel.tsx` — useAction
- `scripts/intune/README.md`, `install-extension-policy.ps1`, `release-extension.ts` — URL updates
- Deleted: `apps/web/app/api/updates/extension/route.ts`, `apps/web/app/api/sessions/terminal/route.ts`, `apps/web/lib/sandbox.ts`, `apps/web/lib/convex-auth.ts`
