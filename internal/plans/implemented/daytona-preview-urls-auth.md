# Plan: "Sign into eva" gating for Daytona preview URLs

## Context

Today the only thing protecting a sandbox preview is Daytona's **signed URL** — a bearer token in the URL. Anyone the link is shared with sees the preview (and its data) for up to 24h, no login. Goal: opening a preview URL requires the viewer to **sign into eva AND have access to the underlying repo** before any content loads.

The in-sandbox reverse proxy (`previewProxy.ts`) is the only entry point to the dev server (dev server binds 127.0.0.1; Daytona exposes only the proxy port), so the gate goes there. No new always-on infra: the proxy already runs per-sandbox and already handles HTTP + WebSocket. eva web app handles interactive Clerk login (Clerk prod keys are pinned to `eva.carepulse.co.uk`); Convex mints/validates a short-lived signed **grant**; the proxy verifies it with a public key (cannot be forged from inside the sandbox).

**Decisions (confirmed):**

- Phase A (authz fix) ships standalone first.
- Gate scope: **all surfaces** (dev preview + code-server editor + VNC desktop + design) → requires always-launch-proxy refactor.
- Browser support: **Chrome-first** — CHIPS partitioned cookie, no parent postMessage re-grant fallback yet (in-app iframe may break on Safari/Firefox until a later iteration; shared-link path is robust everywhere).

**Threat model:** an eva customer sharing a link with an unauthorized outsider. The customer is trusted with their own sandbox, so values eva injects into the proxy at launch (sandboxId, repoId, public key, eva origin) are trusted. Not defending against the customer attacking their own sandbox process → use **asymmetric (ES256)** grants so app code in the sandbox cannot forge them.

---

## Phase A — close the authz gap (standalone, ship first)

`getPreviewUrl` (execution.ts:248) only checks `ctx.auth.getUserIdentity()`, never repo access. Any signed-in user can mint a preview URL for any sandbox.

- Add an internal query wrapping `hasRepoAccess(db, repoId, userId)` (functions.ts).
- `getPreviewUrl` is an `action` (no `ctx.db`): resolve `userId`, then `ctx.runQuery` the internal query; throw if no access.
- File: `packages/backend/convex/_daytona/execution.ts` (+ small internal query, co-locate in execution.ts or functions.ts).

Independent of everything below.

---

## Phase B — gate the preview origin

### B1. Always launch the proxy (gate-coverage refactor)

Today proxy only launches when `navigationSync && ready`. The editor (code-server :8080), desktop (NoVNC :6080) via `SandboxIframeService`, and design preview via `DesignDetailClient` pass no `navigationSync` → no proxy → ungated.

- Decouple proxy launch from `navigationSync`; always launch for every preview port. `navigationSync` controls **only** HTML injection (or always inject — script is idempotent).
- Update callers so all return the proxied (gated) URL: `useSandboxPreview.ts`, `SandboxIframeService.tsx`, `DesignDetailClient.tsx`.
- Confirm WS upgrade path fronts code-server + NoVNC (already has `upgrade` handler).

### B2. Preview-grant keypair (new, isolated)

- New env `PREVIEW_GRANT_PRIVATE_KEY` (ES256 JWK) in Convex. Distinct **issuer `eva-preview`** + **audience `eva-preview`** (no cross-replay with the existing `convex`-audience sandbox JWT). Mirror `sandboxJwt.ts`.
- Private key never leaves Convex; only the **public** JWK is injected into the proxy.
- Grant claims: `{ sub: userId, sandboxId, port, iss, aud, exp }`. Bootstrap-grant TTL **5 min**; session cookie TTL **24h** (matches signed-URL lifetime).

### B3. Parameterize the proxy script

`buildPreviewProxyScript()` (previewProxy.ts:82) is currently static `String.raw`. Change to accept params and **interpolate non-secret values into the script body** (avoids shell-quoting a JWK through `nohup` env): `{ publicKeyJwk, sandboxId, expectedAud, expectedIss, webAppUrl }`.

- Add `node:crypto` ES256 verify: `crypto.verify('sha256', signingInput, { key: crypto.createPublicKey({key: jwk, format: 'jwk'}), dsaEncoding: 'ieee-p1363' }, sig)`. (JOSE sigs are raw r‖s → `ieee-p1363`, not DER.)
- Manual JWT parse: split on `.`, base64url-decode header/payload, verify sig over `header.payload`, check `exp`/`iss`/`aud` and `payload.sandboxId === injected sandboxId`.

### B4. Gate logic in the proxy

Add before route handling in `handleRequest` (line 276) and `upgrade` (line 333):

- **Exempt:** `/__eva_preview_proxy/health` (localhost curl, no cookie).
- **Grant-callback:** request carrying `?__eva_grant=<jwt>` → validate → set cookie `__eva_preview_session` (`HttpOnly; Secure; SameSite=None; Partitioned`, 24h) → 302 to same URL with param stripped (same-origin; stays in iframe). Set `Referrer-Policy: no-referrer` on this response.
- **Has valid cookie:** verify cookie JWT (stateless) → proxy as normal.
- **No grant, document/navigation** (`Accept` includes `text/html`): 302 → `${WEB_APP_URL}/preview-auth?sandbox=&repo=&port=&return=<self full URL>` (build `return` from own `Host`, never client-supplied).
- **No grant, subresource or WS upgrade:** 401 (cannot redirect). `/__convex` + `/__convex-site` gated via cookie only.

### B5. Mint grant on happy path (in-app iframe, no redirect)

`getPreviewUrl` → (Phase A access check) → mint bootstrap grant → return proxy URL with `?__eva_grant=<jwt>` appended. Iframe loads it → proxy sets partitioned cookie → strips param → serves; subresources/WS use the cookie.

- **Do not cache the grant param.** `SandboxIframeService` sessionStorage cache (lines ~104-112) must cache the **base** proxy URL; append a **fresh** grant per mount/refresh (re-call `getPreviewUrl`), else a stale 5-min grant gets replayed.

### B6. eva `/preview-auth` route (cold/shared link + new tab)

New TanStack route `apps/web/src/routes/preview-auth.tsx`, Clerk-gated (login if needed).

- Read `sandbox/repo/port/return`. Call Convex action `mintPreviewGrant` → checks `hasRepoAccess` → mints grant.
- **Open-redirect guard:** validate `new URL(return)` is `https:` and host is a Daytona preview host (suffix match) before redirecting. eva refuses framing, so this path is for top-level navigations.
- 302 back to `return?__eva_grant=<jwt>`. Proxy sets cookie, strips, serves.

---

## Files

| Action | File                                                                    | What                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MODIFY | `packages/backend/convex/_daytona/execution.ts`                         | Phase A access check; always-launch proxy; mint+append bootstrap grant; pass sandboxId/repoId/port to launch                                                  |
| MODIFY | `packages/backend/convex/_daytona/previewProxy.ts`                      | Parameterize `buildPreviewProxyScript`; `node:crypto` ES256 verify; gate logic in `handleRequest` + `upgrade`; cookie set/strip; pass params in `launchProxy` |
| NEW    | `packages/backend/convex/previewGrant.ts`                               | ES256 grant signer (mirror `sandboxJwt.ts`); internal access query; `mintPreviewGrant` action for `/preview-auth`                                             |
| REUSE  | `packages/backend/convex/functions.ts`                                  | `hasRepoAccess` (no change)                                                                                                                                   |
| NEW    | `apps/web/src/routes/preview-auth.tsx`                                  | Clerk-gated handshake route → mint grant → validated redirect back                                                                                            |
| MODIFY | `apps/web/src/lib/components/sandbox/SandboxIframeService.tsx`          | Use proxied URL for all surfaces; don't cache grant param; fresh grant per mount/refresh                                                                      |
| MODIFY | `apps/web/src/lib/components/sandbox/useSandboxPreview.ts`              | Fresh grant per mount/refresh                                                                                                                                 |
| MODIFY | `apps/web/src/routes/_repo/$owner/$repo/designs/DesignDetailClient.tsx` | Proxied URL (was bypassing proxy via no `navigationSync`)                                                                                                     |
| DOC    | env / `auth.config.ts` notes                                            | Register `PREVIEW_GRANT_PRIVATE_KEY` (proxy verifies, not Convex — no new Convex auth provider)                                                               |

---

## Verification

**Phase A:** As user without repo access, call `getPreviewUrl` (or hit the UI) → expect access error. As owner/team member → succeeds.

**Phase B (Chrome):**

1. Launch sandbox, open dev preview in-app iframe → loads without a visible login redirect (grant in URL → cookie). Confirm HMR WebSocket + the previewed app's own `/__convex` WS connect.
2. Verify `node -v` in the sandbox image supports JWK import + `dsaEncoding:'ieee-p1363'` (Node ≥16); pin a minimum.
3. Copy the proxy URL, open in a fresh incognito tab (no eva session) → redirected to `eva.carepulse.co.uk/preview-auth` → after login + access check, preview loads. Without access → denied.
4. Repeat for code-server editor + VNC desktop + design preview (all-surfaces scope) → each gated, WS works.
5. Tamper: edit/expire the grant, or use a grant minted for a different sandbox → proxy rejects (sandboxId mismatch / bad sig / expired).
6. Open-redirect: hit `/preview-auth?return=https://evil.com` → rejected.
7. Confirm `/__eva_preview_proxy/health` still 200s (ungated) and `proxyAlreadyRunning` works.

**Known limitation (accepted):** in-app iframe may fail on Safari/Firefox / Chrome-with-3pc-blocked because the partitioned cookie isn't sent; shared-link (top-level) gating works everywhere. Parent postMessage re-grant fallback deferred to a later iteration.

**Typecheck:** `cd packages/backend && npx convex codegen --typecheck enable`; `npx tsc` in `apps/web`.
