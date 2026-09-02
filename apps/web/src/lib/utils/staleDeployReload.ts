/** Shared with the inline listener in `index.html` — keep the string in sync. */
export const STALE_DEPLOY_RELOAD_KEY = "deployment-reload-ts";
/** Query param used to bypass a cached `index.html` on recovery. Stripped on boot. */
export const STALE_DEPLOY_RELOAD_PARAM = "_eva_reload";
const COOLDOWN_MS = 10_000;

/**
 * Returns true once per cooldown window so a still-broken deploy cannot
 * reload in a loop. Callers must reload immediately after a true result.
 */
export function claimStaleDeployReload(): boolean {
  try {
    const last = sessionStorage.getItem(STALE_DEPLOY_RELOAD_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) return false;
    sessionStorage.setItem(STALE_DEPLOY_RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    // sessionStorage unavailable (e.g. private browsing), allow reload
    return true;
  }
}

/** Drop the one-shot cache-bust param so it never becomes product state. */
export function stripStaleDeployReloadParam(): void {
  const url = new URL(location.href);
  if (!url.searchParams.has(STALE_DEPLOY_RELOAD_PARAM)) return;
  url.searchParams.delete(STALE_DEPLOY_RELOAD_PARAM);
  history.replaceState(
    history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

/**
 * `location.reload()` can reuse a cached HTML document that still points at
 * deleted chunk hashes. A unique query forces the browser to fetch HTML again.
 */
export function reloadForStaleDeploy(): void {
  const url = new URL(location.href);
  url.searchParams.set(STALE_DEPLOY_RELOAD_PARAM, String(Date.now()));
  location.replace(url.href);
}
