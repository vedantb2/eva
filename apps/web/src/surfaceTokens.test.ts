import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "globals.css"),
  "utf8",
);

/**
 * The `r g b` triples declared inside one selector's first block.
 *
 * Deliberately source-text: these tokens are the design system's contract, and
 * the failures they cause — a card that vanishes into the page, a sidebar that
 * reads as a darker panel — are invisible to every other kind of test.
 */
function tokensFor(selector: string): Map<string, number[]> {
  let start = css.indexOf(`${selector} {`);
  while (start >= 0) {
    const block = css.slice(start, css.indexOf("\n  }", start));
    const tokens = new Map<string, number[]>();
    for (const [, name, triple] of block.matchAll(
      /--([\w-]+):\s*(\d+ \d+ \d+);/g,
    )) {
      tokens.set(name, triple.split(" ").map(Number));
    }
    if (tokens.has("background")) return tokens;
    start = css.indexOf(`${selector} {`, start + selector.length + 2);
  }
  expect.fail(`${selector} has no surface-token block in globals.css`);
}

/** Mean channel value, as a stand-in for how light a surface reads. */
function level(rgb: number[]): number {
  return rgb.reduce((sum, channel) => sum + channel, 0) / rgb.length;
}

const themes = [
  { name: "light", tokens: tokensFor(":root") },
  { name: "dark", tokens: tokensFor(".dark") },
  { name: "neutral", tokens: tokensFor(".dark.neutral") },
];

describe.each(themes)("$name surface tokens", ({ tokens }) => {
  function surface(name: string): number[] {
    const rgb = tokens.get(name);
    expect(rgb, `--${name} is not declared as an r g b triple`).toBeDefined();
    return rgb ?? [];
  }

  /**
   * Hierarchy comes from tone steps between these three. Collapsing any pair
   * flattens the whole app: cards stop reading as elevated, and secondary
   * surfaces stop reading as recessed.
   */
  it("keeps background, card and muted on distinct tones", () => {
    expect(surface("background")).not.toEqual(surface("card"));
    expect(surface("card")).not.toEqual(surface("muted"));
    expect(surface("background")).not.toEqual(surface("muted"));
  });

  /** Steps have to be visible, not merely unequal. */
  it("separates each step by more than a rounding error", () => {
    expect(
      Math.abs(level(surface("card")) - level(surface("background"))),
      "card must lift clear of the canvas",
    ).toBeGreaterThan(4);
    expect(
      Math.abs(level(surface("muted")) - level(surface("card"))),
      "muted must sit clear of card",
    ).toBeGreaterThan(4);
  });

  /** `secondary` is the deepest step, so it has to be further out than `muted`. */
  it("orders secondary below muted, away from card", () => {
    const cardLevel = level(surface("card"));
    expect(Math.abs(level(surface("secondary")) - cardLevel)).toBeGreaterThan(
      Math.abs(level(surface("muted")) - cardLevel),
    );
  });

  /**
   * Per the design system the sidebar and app shell share the canvas tone — they
   * are set apart by the region-divider border, not by being a darker panel.
   * Popovers are elevated surfaces, so they share the card tone.
   */
  it("ties the sidebar and app shell to the canvas, and popover to card", () => {
    expect(surface("sidebar")).toEqual(surface("background"));
    expect(surface("app-shell")).toEqual(surface("background"));
    expect(surface("popover")).toEqual(surface("card"));
  });

  /** Borders are how surfaces are defined here, so they cannot be invisible. */
  it("keeps the hairline border readable against both canvas and card", () => {
    const borderLevel = level(surface("border"));
    expect(
      Math.abs(borderLevel - level(surface("background"))),
      "border must be visible on the canvas",
    ).toBeGreaterThan(8);
    expect(
      Math.abs(borderLevel - level(surface("card"))),
      "border must be visible on a card",
    ).toBeGreaterThan(8);
    expect(surface("sidebar-border")).toEqual(surface("border"));
  });
});

it("places neutral background between dark and light", () => {
  const lightBg = level(tokensFor(":root").get("background") ?? []);
  const darkBg = level(tokensFor(".dark").get("background") ?? []);
  const neutralBg = level(tokensFor(".dark.neutral").get("background") ?? []);

  expect(neutralBg).toBeGreaterThan(darkBg);
  expect(neutralBg).toBeLessThan(lightBg);
});
