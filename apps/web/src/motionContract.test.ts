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

/**
 * Four bars and indicators animated a geometry property — two progress bars and
 * the projects timeline bar on `width`, the model picker's selection indicator
 * on `top` — so the browser relayouted the row on every frame of an animation
 * that runs while the user is still moving (fixes 88ad508e, faa1e251). Each now
 * paints at full size and moves with `transform`.
 *
 * Nothing looks broken when this regresses: the bar still fills, it just janks
 * on the machines least able to afford it, which is why it wants a test rather
 * than an eye.
 */
describe("bars animate transform, not geometry", () => {
  const bars = [
    { file: "ui/progress.tsx", root: uiSrc, transform: "translateX(" },
    { file: "ai-elements/test-results.tsx", root: uiSrc, transform: "scaleX(" },
    {
      file: "ai-elements/model-picker-content.tsx",
      root: uiSrc,
      transform: "translateY(",
    },
    {
      file: "lib/components/projects/_components/TimelineBar.tsx",
      root: webSrc,
      transform: "scaleX(",
    },
  ];

  it.each(bars)("$file moves with $transform", ({ file, root, transform }) => {
    const source = stripComments(readFileSync(join(root, file), "utf8"));
    expect(source).toContain(transform);
    expect(source).toContain("transition-transform");
    expect(
      source,
      "transitioning a geometry property relayouts every frame",
    ).not.toMatch(/transition-\[[^\]]*\b(?:width|height|top|left)\b/);
    expect(
      source,
      "size or offset it once in CSS, then move it with transform",
    ).not.toMatch(/style=\{\{[^}]*\b(?:width|height|top|left)\s*:/);
  });

  /**
   * The scaled layers are anchored, not centred: without `origin-left` a
   * `scaleX` bar grows from its middle in both directions and reads as a
   * loading shimmer rather than a fill.
   */
  it.each(bars.filter((bar) => bar.transform === "scaleX("))(
    "$file scales from the left edge",
    ({ file, root }) => {
      expect(stripComments(readFileSync(join(root, file), "utf8"))).toContain(
        "origin-left",
      );
    },
  );

  /**
   * The diffs toolbar's bar was a hand-rolled duplicate of `Progress` and had to
   * be fixed separately from it. Reusing the primitive is what keeps it fixed.
   */
  it("the diffs toolbar reuses the Progress primitive", () => {
    const source = stripComments(
      readFileSync(
        join(webSrc, "lib/components/sandbox/DiffsToolbar.tsx"),
        "utf8",
      ),
    );
    expect(source, "a hand-rolled bar drifts from the primitive").toContain(
      "<Progress",
    );
    expect(source).not.toMatch(/style=\{\{[^}]*\bwidth\s*:/);
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
