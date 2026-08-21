import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { STALE_DEPLOY_RELOAD_KEY } from "./staleDeployReload";

const webApp = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const SPA_FALLBACK = "/((?!assets/).*)";

/**
 * Missing hashed files must 404, not rewrite to index.html. The previous
 * catch-all `/(.*)` served HTML (MIME text/html, and the /assets/ immutable
 * Cache-Control) for stale chunk URLs — Chrome then refused to execute them.
 */
test("SPA fallback does not rewrite hashed /assets/ URLs", () => {
  const config = JSON.parse(readFileSync(join(webApp, "vercel.json"), "utf8"));

  expect(config).toMatchObject({
    rewrites: [{ source: SPA_FALLBACK, destination: "/index.html" }],
  });

  const pattern = new RegExp(`^${SPA_FALLBACK}$`);
  expect(pattern.test("/")).toBe(true);
  expect(pattern.test("/home")).toBe(true);
  expect(pattern.test("/evalucom/carepulse-ts/web/sessions/abc")).toBe(true);
  expect(pattern.test("/assets/index-abc123.js")).toBe(false);
  expect(pattern.test("/assets/worker-xyz.js")).toBe(false);
});

test("index.html reloads on hashed module failure using the shared cooldown key", () => {
  const html = readFileSync(join(webApp, "index.html"), "utf8");
  expect(html).toContain(`var KEY = "${STALE_DEPLOY_RELOAD_KEY}"`);
  expect(html).toContain('url.indexOf("/assets/")');
});
