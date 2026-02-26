# Preview Proxy — Same-Origin Reverse Proxy for Iframe Auth

## Context

The iframe preview loads Daytona sandbox URLs directly (cross-origin). Two issues prevent auth from working:

1. **X-Frame-Options: DENY** — AuthKit blocks its login page in iframes
2. **SameSite=Lax cookies** — not sent in cross-site iframes, so existing sessions don't persist

A same-origin proxy routes all traffic through conductor's domain, solving both issues. User authenticates once through the proxy (email/password), cookie persists for the conductor domain, and subsequent loads work without re-auth.

---

## Files

| Action | File                                                           |
| ------ | -------------------------------------------------------------- |
| NEW    | `apps/web/lib/preview-proxy.ts`                                |
| NEW    | `apps/web/app/api/preview-proxy/[[...path]]/route.ts`          |
| MODIFY | `apps/web/app/(main)/[repo]/sessions/[id]/SandboxPanel.tsx`    |
| MODIFY | `apps/web/app/(main)/[repo]/sessions/[id]/WebPreviewPanel.tsx` |

---

## 1. `apps/web/lib/preview-proxy.ts` — Target Resolution + Caching

- Module-level `Map<string, { signedUrl: string; createdAt: number }>` cache (55min TTL, signed URLs expire at 60min)
- `resolveTarget(sandboxId, port)` → returns signed base URL string (cached or fresh via `getSandbox()` + `getSignedPreviewUrl()`)
- `buildUpstreamUrl(signedBaseUrl, subPath, searchParams)` → full target URL with auth params merged
- `buildExternalUrl(encodedOrigin, remainingPath, searchParams)` → decoded external domain URL
- `evictTarget(sandboxId, port)` → remove cache entry (for retry on 401/403)

## 2. `apps/web/app/api/preview-proxy/[[...path]]/route.ts` — Proxy Route

Single `handler` function exported as GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD.

### Request Flow

```
1. auth() → 401 if no userId
2. Parse path segments
3. Determine target:
   - _ext/<encodedOrigin>/... → external domain (AuthKit)
   - Otherwise → sandbox (sandboxId/port from query params or __pp_sid/__pp_port cookies)
4. Build upstream request (strip Host/Origin/Referer, forward body)
5. Forward cookies (strip internal __pp_* cookies, send rest to upstream)
6. fetch(targetUrl, { redirect: "manual" })
7. Process response:
   - Strip X-Frame-Options
   - Strip frame-ancestors + loosen script-src in CSP
   - Rewrite Location header: same-origin → proxy prefix, cross-origin → _ext/
   - Translate Set-Cookie: remove Domain, set Path=/api/preview-proxy/
   - HTML only: inject runtime script + rewrite root-relative URLs in attributes
8. Set __pp_sid/__pp_port cookies on initial request (query params present)
```

### HTML Rewriting

Regex replace `(src|href|action)="(/(?!/)[^"]*)"` → prefix with `/api/preview-proxy`. Skip protocol-relative `//` URLs and already-proxied paths.

### Injected Runtime Script

Patching targets (all rewrite URLs to go through proxy):

- `fetch()` — root-relative `/path` → `/api/preview-proxy/path`, cross-origin → `_ext/<encoded>/path`
- `XMLHttpRequest.prototype.open()` — same rewriting
- `history.pushState()` / `replaceState()` — prefix root-relative URLs
- `window.open()` — rewrite URLs
- `MutationObserver` on `<form>` elements — rewrite `action` attributes as forms are added to DOM

`location.href = "..."` cannot be reliably patched client-side. Auth redirects that use `location.href` are handled by the proxy's server-side `Location` header rewriting (since `redirect: "manual"` catches 302s before the browser follows them). AuthKit's email/password flow uses server-side redirects, so this is sufficient.

### Cookie Translation

**Inbound (browser → proxy → upstream):** Read all cookies from request, strip `__pp_sid`/`__pp_port`, forward rest as `Cookie` header to upstream.

**Outbound (upstream → proxy → browser):** For each `Set-Cookie`: remove `Domain=...`, replace `Path=X` with `Path=/api/preview-proxy/`, keep HttpOnly/Secure/SameSite.

## 3. `SandboxPanel.tsx` — Use Proxy URL

- Change `PreviewInfo` to `{ url: string; directUrl: string; port: number }`
- After `getPreviewUrl` returns, set:
  - `url` = `/api/preview-proxy/?sandboxId=${sandboxId}&port=${port}` (iframe)
  - `directUrl` = the signed Daytona URL (for "Open in new tab")

## 4. `WebPreviewPanel.tsx` — Pass Direct URL

- Update `PreviewInfo` interface to include `directUrl`
- "Open in new tab" button uses `previewInfo.directUrl` instead of `previewInfo.url`

---

## Auth Flow Through Proxy (Step by Step)

1. Iframe → `/api/preview-proxy/?sandboxId=X&port=3001`
2. Proxy fetches sandbox → 302 to `https://authkit.app/sign-in?redirect_uri=sandbox.io/callback`
3. Proxy rewrites Location → `/api/preview-proxy/_ext/<authkit>/sign-in?redirect_uri=sandbox.io/callback`
4. Browser follows redirect (within iframe, same-origin)
5. Proxy fetches AuthKit page, strips X-Frame-Options, injects runtime script, returns HTML
6. User enters email/password, JS submits via fetch → patched to `_ext/<authkit>/api/...` → proxy forwards
7. AuthKit responds with 302 to `sandbox.io/callback?code=abc` → proxy rewrites Location to `/api/preview-proxy/api/auth/callback?code=abc`
8. Browser follows → proxy forwards to sandbox callback → sandbox exchanges code for token (server-side to AuthKit, NOT through proxy) → sets session cookie
9. Proxy translates cookie (Domain stripped, Path adjusted) → persists on conductor domain
10. Redirect to `/` → rewritten to `/api/preview-proxy/` → iframe loads authenticated app

## Limitations

- **WebSocket/HMR**: Not supported through proxy (Next.js route handlers can't upgrade). Use "Open in new tab" for dev with HMR.
- **SSO providers**: Would need additional proxying if AuthKit uses Google/GitHub OAuth. Current scope: email/password only.
- **redirect_uri mismatch**: If AuthKit's token exchange (step 8, server-side) validates that redirect_uri matches the one from the initial auth request, it will use the sandbox's configured redirect_uri. Since the proxy doesn't modify redirect_uri in the auth URL (step 3), the sandbox's configured redirect_uri matches what AuthKit received. This should work.

## Verification

1. Start sandbox, wait for preview to be ready
2. Iframe should load proxy URL instead of direct Daytona URL
3. First load: AuthKit login page should render inside iframe (no "refused to connect")
4. Enter credentials, submit → should complete auth flow within iframe
5. After auth, sandbox app loads in iframe with working session
6. Refresh page → session cookie persists, no re-auth needed
7. "Open in new tab" button should open the direct Daytona URL (not proxy)
8. Port change should work (new proxy URL with different port)
