// Client-side helpers for the preview-access grant param.
// Must match PREVIEW_GRANT_PARAM in packages/backend/convex/previewGrantConfig.ts.
const PREVIEW_GRANT_PARAM = "__eva_grant";

/**
 * Removes the grant param from a URL. The grant is a short-lived bearer token,
 * so it must never be persisted (it goes stale) or put in a shareable link
 * (sharing it shares access). Use for cached URLs and "open in new tab" links.
 */
export function stripPreviewGrant(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete(PREVIEW_GRANT_PARAM);
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Copies the grant param from `fromUrl` onto `toUrl`, preserving it when a
 * preview URL is rebuilt (e.g. when composing a navigation path). Without this
 * the iframe's first load would drop the grant and bounce to the sign-in
 * handshake inside the iframe, which eva refuses to be framed in.
 */
export function carryPreviewGrant(fromUrl: string, toUrl: string): string {
  try {
    const grant = new URL(fromUrl).searchParams.get(PREVIEW_GRANT_PARAM);
    if (!grant) return toUrl;
    const target = new URL(toUrl);
    target.searchParams.set(PREVIEW_GRANT_PARAM, grant);
    return target.toString();
  } catch {
    return toUrl;
  }
}
