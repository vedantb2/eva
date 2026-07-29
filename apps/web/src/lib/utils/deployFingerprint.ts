/**
 * Build fingerprint from deployed index HTML — Vite hashed `/assets/*.js`
 * URLs change on every production deploy, so a mismatch means a new build.
 */
export function fingerprintFromHtml(html: string): string | null {
  const matches = html.match(/\/assets\/[^"'?\s]+\.js/g);
  if (!matches || matches.length === 0) return null;
  return [...new Set(matches)].toSorted().join("|");
}

/** Fetch the live document root and return its asset fingerprint. */
export async function fetchDeployFingerprint(
  origin: string,
): Promise<string | null> {
  const url = `${origin}/?_vb=${Date.now()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "text/html" },
  });
  if (!response.ok) return null;
  const html = await response.text();
  return fingerprintFromHtml(html);
}
