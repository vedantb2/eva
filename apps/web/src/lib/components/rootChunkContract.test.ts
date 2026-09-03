import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = readFileSync(join(here, "../../routes/__root.tsx"), "utf8");
const motion = readFileSync(join(here, "MotionProvider.tsx"), "utf8");
const prefetch = readFileSync(join(here, "../prefetchSignedInChunks.ts"), "utf8");

/**
 * `__root` is on every visit, including the anonymous landing. A static
 * import here is an entry-graph import: Convex, the preview iframe host and
 * the changelog gate used to parse on first paint even though landing
 * rendered none of them.
 */
test("the root route lazy-loads Convex, preview and changelog", () => {
  expect(root).not.toMatch(
    /import\s*\{[^}]*ClientProvider[^}]*\}\s*from\s+"@\/lib\/components\/ClientProvider"/,
  );
  expect(root).not.toMatch(
    /import\s*\{[^}]*PreviewIframeHost[^}]*\}\s*from/,
  );
  expect(root).not.toMatch(
    /import\s*\{[^}]*PreviewMiniPlayer[^}]*\}\s*from/,
  );
  expect(root).not.toMatch(
    /import\s*\{[^}]*ChangelogDialogGate[^}]*\}\s*from/,
  );
  expect(root).not.toMatch(/from\s+"@vercel\/analytics\/react"/);
  expect(root).toContain('import("@/lib/components/ClientProvider")');
  expect(root).toContain('import("@/lib/components/sandbox/previewIframeHost")');
  expect(root).toContain('import("@/lib/components/sandbox/PreviewMiniPlayer")');
  expect(root).toContain('import("@/lib/components/ChangelogDialogGate")');
});

test("motion features are a separate async chunk", () => {
  expect(motion).not.toMatch(/import\s*\{[^}]*domMax[^}]*\}\s*from\s+"motion\/react"/);
  expect(motion).toContain('features={() => import("@/lib/motionFeatures")}');
});

test("returning users prefetch the signed-in shell, not just chrome", () => {
  expect(prefetch).toContain('import("@/lib/components/AppShellChrome")');
  expect(prefetch).toContain('import("@/lib/components/ClientProvider")');
  // Preview host contends with home LCP — only after idle.
  expect(prefetch).toContain("prefetchPreviewChunksWhenIdle");
  const eager = prefetch.slice(
    prefetch.indexOf("export function prefetchSignedInChunks"),
    prefetch.indexOf("export function prefetchPreviewChunksWhenIdle"),
  );
  expect(eager).not.toContain("previewIframeHost");
});
