import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

const lastTurn = readFileSync(join(here, "ChatLastTurn.tsx"), "utf8");
const chatBody = readFileSync(join(here, "ChatBody.tsx"), "utf8");

/**
 * Regression: the last-turn pad used to measure the scroller with a
 * ResizeObserver and hold the height in React state, so it applied a frame
 * after the composer changed size. Collapsing the composer to a pill dropped
 * the thread and then snapped it back.
 *
 * The pad is now `100cqh` of the scroller, which resolves in the same layout
 * pass. That only works while the scroller is a size container — the two files
 * have to stay in sync, and nothing else would catch them drifting apart.
 */
test("the last-turn pad sizes against the conversation scroller", () => {
  expect(lastTurn).toMatch(/min-h-\[calc\(100cqh-[^\]]+\)\]/);
  expect(chatBody).toMatch(/scrollClassName="[^"]*container-type:size/);
});

test("the pad does not measure the scroller in React", () => {
  // The doc comment names the path it replaced, so read past the comments.
  const code = lastTurn.replace(/\/\*[\s\S]*?\*\//g, "");
  expect(code).not.toContain("ResizeObserver");
  expect(code).not.toContain("useStickToBottomContext");
  expect(code).not.toContain("useState");
});
