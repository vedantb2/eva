import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const webSrc = dirname(fileURLToPath(import.meta.url));
const webApp = join(webSrc, "..");
const uiSrc = join(webSrc, "..", "..", "..", "packages", "ui", "src");

/** Comments here name the very declarations these rules ban, so they go first. */
const cssRules = stripComments(
  readFileSync(join(webSrc, "globals.css"), "utf8").replaceAll("\r\n", "\n"),
);

function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

/** A top-level `@utility <name> { … }` block, up to the brace that closes it. */
function utility(name: string): string {
  const startAt = cssRules.indexOf(`@utility ${name} {`);
  expect(startAt, `the ${name} utility is gone`).toBeGreaterThan(-1);
  const endAt = cssRules.indexOf("\n}", startAt);
  expect(endAt, `the ${name} utility is unterminated`).toBeGreaterThan(startAt);
  return cssRules.slice(startAt, endAt);
}

/**
 * Every styled source file in the app and the design system, with comments
 * stripped so a rule can be explained next to the pattern it bans.
 */
function styledSources(): Array<{ path: string; source: string }> {
  const files: Array<{ path: string; source: string }> = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(full);
        continue;
      }
      // Test files quote the patterns under test, this one included.
      if (/\.test\.[cm]?[jt]sx?$/.test(entry.name)) continue;
      if (!/\.(?:tsx?|css)$/.test(entry.name)) continue;
      files.push({
        path: relative(webApp, full),
        source: stripComments(readFileSync(full, "utf8")).replaceAll(
          /\/\/.*$/gm,
          "",
        ),
      });
    }
  };
  walk(webSrc);
  walk(uiSrc);
  expect(files.length, "no sources found").toBeGreaterThan(100);
  return files;
}

/**
 * Every route has to be usable on a phone, and the failures that got us here
 * were not subtle-CSS problems — they were whole controls that could not be
 * reached at all. These rules pin the handful of decisions that fix a class of
 * route at once, because each of them was already re-broken locally before it
 * was fixed centrally.
 */
describe("the mobile viewport contract", () => {
  /**
   * `maximum-scale=1, user-scalable=no` shipped in the viewport meta, which is a
   * WCAG 1.4.4 failure: it takes pinch-zoom away from everyone to avoid iOS's
   * auto-zoom on focusing a sub-16px input. The inputs are the actual bug, and
   * they are fixed where they live (`text-base sm:text-sm` on the form
   * primitives). `viewport-fit=cover` is what makes `env(safe-area-inset-*)`
   * report anything other than zero, so the notch padding depends on it.
   */
  it("lets the user zoom, and opts into the safe-area insets", () => {
    const html = readFileSync(join(webApp, "index.html"), "utf8");
    const meta = html.slice(
      html.indexOf('name="viewport"'),
      html.indexOf(">", html.indexOf('name="viewport"')),
    );
    expect(meta, "no viewport meta").toContain("width=device-width");
    expect(meta, "blocking zoom fails WCAG 1.4.4").not.toContain(
      "user-scalable=no",
    );
    expect(meta, "capping scale fails WCAG 1.4.4").not.toContain(
      "maximum-scale",
    );
    expect(meta, "env(safe-area-inset-*) stays 0 without it").toContain(
      "viewport-fit=cover",
    );
  });

  /**
   * `100vh` is the *largest* viewport height, so on iOS Safari it is taller than
   * what you can see: the browser chrome covers the bottom of it. The repo shell
   * was `h-screen overflow-hidden`, which clipped the bottom of every page in
   * the app — composers, footers, bulk bars — with no way to scroll to them.
   * `dvh` tracks the visible area, `svh` the smallest. Neither `h-screen` nor a
   * bare `vh` is ever the right answer here; `vw` is fine and stays allowed.
   */
  it("sizes full-height layouts in dvh/svh, never vh", () => {
    const offenders = styledSources().flatMap(({ path, source }) => {
      const hits = [
        ...source.matchAll(/\b(?:min-|max-)?h-screen\b/g),
        // `100dvh` does not match: the digits are followed by `d`, not `v`.
        ...source.matchAll(/\b\d+(?:\.\d+)?vh\b/g),
      ];
      return hits.map((hit) => `${path}: ${hit[0]}`);
    });
    expect(
      offenders,
      "use dvh (or svh) — 100vh is taller than the visible viewport on iOS",
    ).toEqual([]);
  });
});

/**
 * Roughly a third of the app's row-level actions were revealed by
 * `opacity-0 group-hover:opacity-100`. Touch has no hover, so those controls
 * were not merely hard to find: removing a chat attachment, opening a comment's
 * overflow menu and dismissing a toast were all impossible on a phone. The
 * utility is the one place that trade-off is allowed to live.
 */
describe("the reveal-on-hover utility", () => {
  it("ships the control visible and only hides it where hover exists", () => {
    const block = utility("reveal-on-hover");
    expect(block).toMatch(/opacity:\s*1/);

    const hidden = block.slice(block.indexOf("@media"));
    expect(hidden, "no media query — the reveal is unconditional").toBeTruthy();
    // The trap this exists to hold shut. This project's `hover:` variant
    // compiles with `@media (hover: hover)`, so gating the hidden state on width
    // alone leaves the control permanently invisible on a landscape tablet: wide
    // enough to hide it, with no hover to bring it back.
    expect(
      hidden,
      "gate the hidden state on hover capability, not just width",
    ).toContain("hover: hover");
    expect(hidden).toMatch(/width\s*>=/);
    expect(hidden).toMatch(/opacity:\s*0/);
  });

  /**
   * `opacity: 0` on its own leaves the control clickable while invisible, so the
   * row carries a dead tap zone that swallows taps meant for the row itself.
   * Focus has to bring it back, or a keyboard user tabs to something they cannot
   * see.
   */
  it("moves pointer-events with the opacity, and restores both on focus", () => {
    const block = utility("reveal-on-hover");
    expect(block).toMatch(/pointer-events:\s*auto/);
    const hidden = block.slice(block.indexOf("@media"));
    expect(hidden).toMatch(/pointer-events:\s*none/);
    expect(hidden).toContain(":focus-visible");
    expect(hidden).toContain(":focus-within");
  });
});

/**
 * The comfortable-tap floor is 40px. `hit-target` grows the pressable area with
 * a `::after` inset instead of changing layout, but adoption sat near a quarter
 * of the sub-40px controls — a 24px destructive delete and 14px tab-close
 * buttons among them. Baking it into the small `Button` sizes means a consumer
 * inherits a compliant target and only hand-rolled `<button>`s need thought.
 *
 * `sm`/`icon-sm` take it as `max-sm:hit-target`, because the 8px bleed is
 * invisible but it *is* a change to where a pointer has to be to click, and this
 * work was scoped to mobile only. `xs`/`icon-xs` predate that and keep the
 * ungated utility they shipped with.
 */
describe("small Button sizes", () => {
  const ungated = ["xs", "icon-xs"];
  const mobileOnly = ["sm", "icon-sm"];

  it.each([...ungated, ...mobileOnly])(
    "%s reaches the 40px floor on touch",
    (size) => {
      const button = readFileSync(join(uiSrc, "ui", "button.tsx"), "utf8");
      const variants = button.slice(
        button.indexOf("size:"),
        button.indexOf("defaultVariants"),
      );
      // Only the hyphenated keys are quoted in the object literal.
      const at = variants.search(new RegExp(`"?${size}"?:`));
      expect(at, `the ${size} size is gone`).toBeGreaterThan(-1);
      const declaration = variants.slice(at, variants.indexOf("\n", at));
      expect(
        declaration,
        `${size} is under 40px and needs hit-target`,
      ).toContain("hit-target");
      if (mobileOnly.includes(size)) {
        expect(
          declaration,
          `${size} grew a desktop hit area; gate it as max-sm:hit-target`,
        ).toContain("max-sm:hit-target");
      }
    },
  );
});

/**
 * A `TabsList` is `inline-flex`, and the shells that hold it are
 * `overflow-hidden`, so a strip of four or more tabs was not just cramped — the
 * trailing tabs were clipped away with no way to reach them. Snapshots' four
 * tabs and the sandbox's six-to-eight were both unreachable on a phone.
 *
 * The scroll is `max-sm:`-gated: desktop keeps the centred, non-scrolling strip
 * it always had, because this work was scoped to mobile only.
 */
describe("the TabsList primitive", () => {
  it("scrolls its own overflow on a phone, and only there", () => {
    // Comments stripped first: the one above this class names the very utility
    // the rules below check for.
    const tabs = stripComments(
      readFileSync(join(uiSrc, "ui", "tabs.tsx"), "utf8"),
    ).replaceAll(/\/\/.*$/gm, "");
    const base = tabs.slice(
      tabs.indexOf("tabsListVariants"),
      tabs.indexOf("variants:"),
    );
    expect(base).toContain("max-sm:overflow-x-auto");
    expect(base).toContain("max-sm:max-w-full");
    // Centred content that overflows spills past *both* edges, and `scrollLeft`
    // cannot go negative, so the leading tabs become unreachable — the same bug
    // at the other end of the strip. Safe alignment falls back to start, and it
    // is only needed where the strip actually scrolls.
    expect(
      base,
      "centred overflow strands the leading tabs; use safe alignment on mobile",
    ).toContain("max-sm:justify-center-safe");
    expect(
      base,
      "desktop kept plain centring, so an ungated safe variant is a desktop change",
    ).not.toMatch(/(?<!max-sm:)justify-center-safe/);
  });
});

/**
 * Below `md` there is only room for one pane. Both split primitives used to put
 * two independently scrollable panes on screen at once — `ResizablePanelLayout`
 * at `h-1/2` each, which is what made the quick-task view unusable on a phone
 * (a ~370px list above a ~370px task detail), and `ResizableSidebar` at a hard
 * `160 + 320`px floor that simply scrolled the page sideways.
 */
describe("the split-pane primitives", () => {
  const primitives = ["ResizablePanelLayout", "ResizableSidebar"] as const;

  it.each(primitives)("%s collapses to one pane below md", (name) => {
    const source = readFileSync(
      join(webSrc, "lib", "components", `${name}.tsx`),
      "utf8",
    );
    expect(source, "no mobile branch").toContain("useMediaQuery");
    expect(source).toContain("max-width: 767px");
    // Halving the viewport is the bug, not the fix.
    expect(
      source,
      "two half-height panes is the bug this replaced",
    ).not.toMatch(/\bh-1\/2\b/);
    // The call sites' own pane toggle lives inside the left pane, which is
    // hidden while the right one shows, so the primitive has to supply the way
    // back itself or the user is stranded.
    expect(source, "no way back to the other pane").toContain(
      "MobilePaneSwitcher",
    );
  });
});

/**
 * A wide table inside a plain `<div>` widens the page instead of scrolling, and
 * `overflow-x-auto` alone does not fix that: a flex or grid child defaults to
 * `min-width: auto`, so the wrapper grows to its content and never overflows.
 * `min-w-0` is the load-bearing half of the pair.
 */
describe("the Table primitive", () => {
  it("scrolls wide tables inside their own box", () => {
    const table = readFileSync(join(uiSrc, "ui", "table.tsx"), "utf8");
    const wrapper = table.slice(0, table.indexOf("<table"));
    expect(wrapper).toContain("overflow-x-auto");
    expect(wrapper, "without min-w-0 the wrapper grows instead").toContain(
      "min-w-0",
    );
  });
});

/**
 * Radix positions overlays against the viewport but does not size them for it. A
 * `w-96` popover is wider than a 320px screen, and a `max-h-[90vh]` dialog puts
 * its own action row under the browser chrome — the two ways an overlay ends up
 * partly unreachable on a phone.
 */
describe("floating overlays", () => {
  const overlays = [
    "dialog.tsx",
    "popover.tsx",
    "hover-card.tsx",
    "tooltip.tsx",
    "_menu-classes.ts",
  ] as const;

  it.each(overlays)("%s caps its width against the viewport", (file) => {
    const source = readFileSync(join(uiSrc, "ui", file), "utf8");
    // `w-` counts as well as `max-w-`: a dialog sets its width outright, and a
    // gutter-aware `w-[calc(100vw-2rem)]` is already bounded.
    expect(source, "an overlay can be wider than a 320px screen").toMatch(
      /\bmax-w-\[calc\(100vw-|\bw-\[calc\(100vw-/,
    );
  });
});
