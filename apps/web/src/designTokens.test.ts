import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const primitivesDir = join(
  here,
  "..",
  "..",
  "..",
  "packages",
  "ui",
  "src",
  "ui",
);

describe("primitive insets", () => {
  /**
   * `tailwind-merge` resolves conflicts within a variant group, never across
   * them. A primitive whose default padding is `p-5 md:p-6` therefore keeps the
   * `md:p-6` when a call site passes `p-3`, and the override half-applies: right
   * at the breakpoint where the extra room was supposed to help, the call site
   * loses control of its own inset.
   *
   * That shipped. `CardContent` defaulted to `p-5 pt-0 md:p-6 md:pt-0`, so
   * thirteen call sites passing `p-3` rendered `padding: 0 24px 24px` above
   * 768px — content flush to the card's top edge over a band of dead space,
   * while the source read as if the override had worked.
   *
   * A primitive that wants a responsive inset should expose it as a prop. A
   * call site that wants one can still write `p-3 md:p-6` and get exactly that.
   */
  it("keeps primitive padding defaults free of responsive variants", () => {
    const files = readdirSync(primitivesDir).filter((name) =>
      name.endsWith(".tsx"),
    );
    expect(files.length, "no primitives found").toBeGreaterThan(0);

    for (const name of files) {
      const source = readFileSync(join(primitivesDir, name), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      expect(
        source,
        `${name} pairs a responsive padding with a default inset`,
      ).not.toMatch(/\b(?:sm|md|lg|xl|2xl):p[trblxy]?-/);
    }
  });
});
