import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "globals.css"), "utf8");
const config = readFileSync(join(here, "..", "tailwind.config.js"), "utf8");

/**
 * Contract tests for the token layer, as a companion to surfaceTokens.test.ts.
 *
 * Source-text on purpose. Each of these has already regressed silently at least
 * once: the dark shadow ramp was a byte-for-byte copy of the light one on a
 * near-black canvas, and the reduced-motion block spent months commented out
 * while an infinite spinner shipped. Nothing else in the suite can see either,
 * because both are valid CSS that simply does nothing.
 */

/** The body of the first `name: { ... }` object at one indent level. */
function configBlock(name: string): string {
  const start = config.indexOf(`  ${name}: {`);
  expect(start, `${name} is missing from tailwind.config.js`).toBeGreaterThan(
    -1,
  );
  return config.slice(start, config.indexOf("\n  },", start));
}

/** CSS with comments removed, so a commented-out rule cannot look live. */
const activeCss = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Every `--shadow*` declaration inside one selector's first block. */
function shadowsFor(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} block is missing`).toBeGreaterThan(-1);
  const block = css.slice(start, css.indexOf("\n  }", start));
  return [...block.matchAll(/--shadow[\w-]*:([\s\S]*?);/g)]
    .map(([, value]) => value.replace(/\s+/g, " ").trim())
    .join("\n");
}

describe("shadow ramp", () => {
  /**
   * The light values are pure black at low alpha. Reused verbatim on a `rgb(5 6 6)`
   * canvas they are invisible, which made all 50 shadow utilities no-ops in the
   * default theme — the elevation model silently did not exist in dark mode.
   */
  it("gives each appearance its own values", () => {
    const light = shadowsFor(":root");
    expect(light.length, "light shadows are missing").toBeGreaterThan(0);
    expect(shadowsFor(".dark"), "dark reuses the light ramp").not.toEqual(
      light,
    );
    expect(
      shadowsFor(".dark.neutral"),
      "neutral reuses the light ramp",
    ).not.toEqual(light);
  });

  /** Duplicate steps mean the scale offers fewer choices than it advertises. */
  it.each([":root", ".dark", ".dark.neutral"])(
    "keeps every step in %s distinct",
    (selector) => {
      const steps = shadowsFor(selector).split("\n");
      expect(new Set(steps).size, "ramp contains duplicate steps").toBe(
        steps.length,
      );
    },
  );
});

describe("motion", () => {
  it("honours prefers-reduced-motion", () => {
    expect(activeCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  /**
   * An infinite animation is the one thing the reduced-motion block must stop,
   * so it is the one thing worth asserting about the block's contents. There is
   * more than one such block, so the cap only has to live in one of them.
   */
  it("caps iteration count under reduced motion", () => {
    const capped = [
      ...activeCss.matchAll(/@media \(prefers-reduced-motion: reduce\)/g),
    ].some((match) =>
      activeCss
        .slice(match.index, match.index + 600)
        .includes("animation-iteration-count"),
    );
    expect(capped, "no reduced-motion block caps iteration count").toBe(true);
  });
});

describe("type scale", () => {
  /**
   * A fontSize entry without a line height inherits whatever the parent set,
   * which is how a 10px label ends up on a 24px line.
   */
  it("pairs every step with an explicit line height", () => {
    const block = configBlock("fontSize");
    const steps = [...block.matchAll(/"([\w-]+)":\s*\[([^\]]*)\]/g)];
    expect(steps.length, "no fontSize steps found").toBeGreaterThan(0);
    for (const [, name, value] of steps) {
      expect(value, `${name} has no lineHeight`).toContain("lineHeight");
    }
  });
});

describe("radius scale", () => {
  /**
   * `--radius` is user-set from 0 to 9999px. Unbounded arithmetic breaks at both
   * ends: subtraction goes negative at `none` (invalid, so the browser drops the
   * declaration), and addition stays a pill at `full`, collapsing every step to
   * the same shape.
   */
  it("bounds every derived step at both ends", () => {
    const block = configBlock("borderRadius");
    const entries = [...block.matchAll(/^\s+"?([\w-]+)"?:\s*"([^"]+)",/gm)];
    expect(entries.length, "no borderRadius entries found").toBeGreaterThan(0);

    for (const [, name, value] of entries) {
      // `lg` is deliberately raw — pill-able single-line rows are the intent,
      // and button.tsx depends on it.
      if (value === "var(--radius)") continue;

      expect(value, `${name} has no upper bound`).toMatch(/min\(|clamp\(/);
      if (value.includes("- ")) {
        expect(value, `${name} subtracts without a floor`).toMatch(
          /max\(|clamp\(/,
        );
      }
    }
  });
});

describe("text tiers", () => {
  /**
   * `--subtle-foreground` exists to replace nine ad-hoc alphas, the lightest of
   * which fell under the legibility floor. It only helps if it sits between
   * muted and the canvas in every appearance — outside that range it is either
   * indistinguishable from muted or as unreadable as the alphas it replaced.
   */
  it.each([":root", ".dark", ".dark.neutral"])(
    "orders subtle between muted and the canvas in %s",
    (selector) => {
      const start = css.indexOf(`${selector} {`);
      const block = css.slice(start, css.indexOf("\n  }", start));
      const read = (name: string): number => {
        const match = block.match(
          new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+);`),
        );
        expect(match, `--${name} is missing from ${selector}`).not.toBeNull();
        const [, r, g, b] = match ?? ["0", "0", "0", "0"];
        return (Number(r) + Number(g) + Number(b)) / 3;
      };

      const background = read("background");
      const muted = read("muted-foreground");
      const subtle = read("subtle-foreground");

      expect(
        Math.abs(subtle - background),
        "subtle must stay clear of the canvas",
      ).toBeGreaterThan(30);
      expect(
        Math.abs(subtle - background),
        "subtle must recede further than muted",
      ).toBeLessThan(Math.abs(muted - background));
    },
  );
});
