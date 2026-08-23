/** Shared with the inline listener in `index.html` — keep the string in sync. */
export const STALE_DEPLOY_RELOAD_KEY = "deployment-reload-ts";
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
