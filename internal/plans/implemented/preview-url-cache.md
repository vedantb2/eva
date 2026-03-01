# Preview & Editor URL SessionStorage Cache

## Problem

Preview URL and editor URL were ephemeral useState — lost on page refresh. Both re-polled `getPreviewUrl` from scratch (health check every 3s, 3-10 attempts = 9-30s delay). Additionally, `toggleCodeServer` blindly started a new code-server on every page refresh, killing previous terminal sessions and forcing users to restart dev servers on a different port.

## Decisions

- **sessionStorage** to cache signed URLs client-side. URLs are browser-specific (iframe src) and don't need to be shared across devices. sessionStorage clears on tab close — no stale URLs lingering.
- **No TTL on cache** — Signed URLs set to 30-day expiry (effectively permanent). Cache invalidated only when sandbox goes inactive, which is the only scenario where URLs actually stop working.
- **Preview port in URL** via nuqs (`?port=3000`) so it survives page refresh.
- **Idempotent code-server start** — Backend checks `pgrep` before starting, frontend checks if port 8080 is already responding before calling `toggleCodeServer`. Existing terminals and dev servers survive page refresh.

## Implementation

1. **`daytona.ts`** — Signed URL expiry set to `2592000` (30 days). `toggleCodeServer` start command guarded with `pgrep -f 'code-server.*8080'`.
2. **`SandboxPanel.tsx`** — sessionStorage cache for preview URL keyed by `conductor:preview:{sessionId}:{port}`. On mount, use cached URL if present, skip polling. Clear on sandbox inactive.
3. **`EditorPanel.tsx`** — sessionStorage cache for editor URL keyed by `conductor:editor:{sessionId}`. `startEditor` checks if port 8080 is already responding before calling `toggleCodeServer`. On mount, use cached URL if present, skip startup entirely.
4. **`search-params.ts`** — Added `previewPortParser` (nuqs `parseAsInteger`, default 3001). SandboxPanel uses `useQueryState("port")` instead of `useState`.
5. **Schema** — Removed `fileDiffs` field from sessions table (unrelated cleanup done in same session).
