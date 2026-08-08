import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

const webSrc = dirname(fileURLToPath(import.meta.url));
const uiSrc = join(webSrc, "..", "..", "..", "packages", "ui", "src");

const css = readFileSync(join(webSrc, "globals.css"), "utf8").replaceAll(
  "\r\n",
  "\n",
);
/** Comments name the very classes these rules ban, so they have to go first. */
const cssRules = stripComments(css);
const tailwindConfig = stripComments(
  readFileSync(join(webSrc, "..", "tailwind.config.js"), "utf8"),
);

/**
 * 184 call sites write a bare `transition-colors` / `transition-transform` and
 * never reach for a token, so the house curve has to be the *default* rather
 * than something each site opts into (fix 27a36884). Tailwind's own defaults
 * are 150ms and `cubic-bezier(0.4, 0, 0.2, 1)` — close enough to look right and
 * wrong enough to read as two different systems side by side.
 */
describe("the default transition is the house one", () => {
  it("points the two Tailwind defaults at the motion tokens", () => {
    expect(cssRules).toMatch(
      /--default-transition-duration:\s*var\(--motion-fast\)/,
    );
    expect(cssRules).toMatch(
      /--default-transition-timing-function:\s*var\(--motion-ease-out\)/,
    );
  });

  /**
   * The trap this exists to hold shut. Overriding either default through the v3
   * config makes Tailwind v4 drop its own `--default-transition-*` definitions
   * from the sheet while still emitting the `var()` references to them, so every
   * bare `transition-*` in the app falls back to `0s` and simply stops
   * animating. Nothing errors, and the config edit looks like the tidier of the
   * two places to make the change — which is exactly why it gets tried again.
   */
  it.each(["transitionDuration", "transitionTimingFunction"])(
    "does not override %s in the Tailwind config",
    (key) => {
      expect(
        tailwindConfig,
        `${key}.DEFAULT here collapses every bare transition to 0s — set it in globals.css`,
      ).not.toMatch(new RegExp(`${key}\\s*:\\s*\\{`));
    },
  );

  /**
   * `tailwindcss-animate` registers its own `ease` namespace, and for an
   * arbitrary value its rule is the only one emitted — so `ease-(--motion-ease-out)`
   * sets `animation-timing-function` and never touches the transition it was
   * written for. It reads as tokenised and does nothing (fix 88ad508e). The
   * default above is already that curve.
   */
  it("has no arbitrary ease utility pointing at a motion token", () => {
    const offenders = sourceFiles().filter((path) =>
      /ease-(?:\(|\[var\()--motion/.test(
        stripComments(readFileSync(path, "utf8")),
      ),
    );
    expect(
      offenders,
      "an arbitrary ease- value only sets animation-timing-function",
    ).toEqual([]);
  });
});

/**
 * Two dozen controls across the app are hidden at `opacity-0` and revealed by
 * `group-hover:opacity-100` — row actions, tab close buttons, sidebar
 * affordances. On a device with no hover they cannot be revealed at all, so on
 * a phone they are not hidden, they are absent (fix c6d74b1d). One rule covers
 * every call site.
 */
describe("hover-only controls are reachable without hover", () => {
  const revealAt = cssRules.indexOf("@media (hover: none)");

  it("reveals the group-hover opacity utility when hover is unavailable", () => {
    expect(revealAt, "the touch reveal rule is gone").toBeGreaterThan(-1);
    const block = cssRules.slice(revealAt, cssRules.indexOf("\n}", revealAt));
    expect(block).toContain(".group-hover\\:opacity-100");
    expect(block).toMatch(/opacity:\s*1/);
  });

  /**
   * `.opacity-0` lives in `@layer utilities` and both selectors are a single
   * class, so a layered rule ties on specificity and loses to whichever comes
   * later — the reveal silently stops working. Unlayered CSS beats every layer,
   * which is the only reason this rule wins.
   */
  it("keeps the rule outside every cascade layer", () => {
    expect(
      enclosingBlocks(cssRules, revealAt).filter((prelude) =>
        prelude.startsWith("@layer"),
      ),
      "a layered rule ties with .opacity-0 on specificity and loses",
    ).toEqual([]);
  });
});

/** The preludes of the blocks open at `index`, outermost first. */
function enclosingBlocks(source: string, index: number): string[] {
  const stack: string[] = [];
  let preludeStart = 0;
  for (let at = 0; at < index; at++) {
    const char = source[at];
    if (char === "{") {
      stack.push(source.slice(preludeStart, at).trim());
      preludeStart = at + 1;
    } else if (char === "}") {
      stack.pop();
      preludeStart = at + 1;
    } else if (char === ";") {
      preludeStart = at + 1;
    }
  }
  return stack;
}

/** Every hand-written component source that can carry a class name. */
function sourceFiles(): string[] {
  return [webSrc, uiSrc].flatMap((root) =>
    readdirSync(root, { recursive: true })
      .map((entry) => join(root, String(entry)))
      .filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".d.ts")),
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
