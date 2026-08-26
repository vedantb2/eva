import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(join(here, file), "utf8");

const provider = read("AveLauncherProvider.tsx");
const panel = read("AvePanel.tsx");
const button = read("AveLauncherButton.tsx");

/**
 * Regression: the whole popover used to be one lazy chunk, so the first click
 * waited on the session tree (chat, mentions, markdown) before anything
 * rendered — the origin-aware spring never played, it just appeared.
 *
 * The split moved down a level: chrome is eager so the spring runs on click,
 * and only `AvePanelBody` is lazy. Re-wrapping `AvePanel` in `lazy` would put
 * the delay back with nothing failing, so pin the boundary here.
 */
test("the popover chrome is eager and only the body is lazy", () => {
  expect(provider).toMatch(
    /import \{ AvePanel \} from "@\/lib\/components\/ave\/AvePanel"/,
  );
  expect(provider).not.toContain("lazy(");
  expect(provider).not.toContain("Suspense");

  expect(panel).toMatch(/lazy\(\s*\(\) =>\s*import\([^)]*AvePanelBody/);
  expect(panel).toContain("Suspense");
});

/** Hover/focus starts the body chunk so the first click rarely waits at all. */
test("the launcher preloads the body on intent", () => {
  expect(provider).toMatch(/import\([^)]*AvePanelBody/);
  expect(provider).toContain("onIntent={preloadAvePanelBody}");

  expect(button).toContain("onMouseEnter={onIntent}");
  expect(button).toContain("onFocus={onIntent}");
});
