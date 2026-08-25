import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BOTTOM_PANEL_ID,
  LEFT_PANEL_ID,
  complementaryPercentage,
  isCollapsedPanelSize,
  isMeasuredPanelSize,
  panelPercentage,
  RIGHT_PANEL_ID,
  TOP_PANEL_ID,
  usableStoredSize,
} from "./usePersistentPanelSize";

describe("panelPercentage", () => {
  it("reads a panel's share from the flexGrow ratio", () => {
    const layout = { [LEFT_PANEL_ID]: 40, [RIGHT_PANEL_ID]: 60 };
    expect(panelPercentage(layout, "left")).toBe(40);
    expect(panelPercentage(layout, "right")).toBe(60);
  });

  it("reads vertical panel shares from the same ratio", () => {
    const layout = { [TOP_PANEL_ID]: 65, [BOTTOM_PANEL_ID]: 35 };
    expect(panelPercentage(layout, "top")).toBe(65);
    expect(panelPercentage(layout, "bottom")).toBe(35);
  });

  /**
   * The library is free to normalise flexGrow to any scale, so the percentage
   * has to come from the ratio rather than off one value.
   */
  it("holds whatever scale the library normalises flexGrow to", () => {
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 1, [RIGHT_PANEL_ID]: 3 }, "right"),
    ).toBe(75);
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 200, [RIGHT_PANEL_ID]: 600 }, "right"),
    ).toBe(75);
  });

  it("returns null when a panel is missing from the layout", () => {
    expect(panelPercentage({ [LEFT_PANEL_ID]: 40 }, "left")).toBeNull();
    expect(panelPercentage({}, "right")).toBeNull();
  });

  it("returns null for a zero-width group instead of dividing by zero", () => {
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 0, [RIGHT_PANEL_ID]: 0 }, "right"),
    ).toBeNull();
  });

  /** A NaN layout must not be persisted as a `NaN%` width. */
  it("returns null when a flexGrow value is not finite", () => {
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: NaN, [RIGHT_PANEL_ID]: 60 }, "right"),
    ).toBeNull();
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 40, [RIGHT_PANEL_ID]: NaN }, "right"),
    ).toBeNull();
  });

  /** Collapsed is tracked separately; 0 is not a width worth returning to. */
  it("reports 0 for a collapsed panel so callers can skip persisting it", () => {
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 100, [RIGHT_PANEL_ID]: 0 }, "right"),
    ).toBe(0);
  });
});

describe("isMeasuredPanelSize", () => {
  /**
   * The report a panel makes from inside a `display: none` subtree: 0px wide in
   * a 0px group, so the library's `panelWidth / groupWidth` percentage is NaN.
   * Kept-alive session shells are hidden that way on every session switch.
   */
  it("rejects the NaN report a hidden panel makes", () => {
    expect(isMeasuredPanelSize({ asPercentage: NaN, inPixels: 0 })).toBe(false);
  });

  /** A real collapse is 0% of a measured group, and must still count. */
  it("accepts a collapsed panel", () => {
    expect(isMeasuredPanelSize({ asPercentage: 0, inPixels: 0 })).toBe(true);
  });

  it("accepts a laid-out panel", () => {
    expect(isMeasuredPanelSize({ asPercentage: 60, inPixels: 720 })).toBe(true);
  });
});

describe("isCollapsedPanelSize", () => {
  it("treats 0% as collapsed when there is no rail leftover", () => {
    expect(
      isCollapsedPanelSize({ asPercentage: 0, inPixels: 0 }, 0),
    ).toBe(true);
    expect(
      isCollapsedPanelSize({ asPercentage: 60, inPixels: 720 }, 0),
    ).toBe(false);
  });

  it("treats the rail width as collapsed, not 0%", () => {
    expect(
      isCollapsedPanelSize({ asPercentage: 3.4, inPixels: 44 }, 44),
    ).toBe(true);
    expect(
      isCollapsedPanelSize({ asPercentage: 3.4, inPixels: 46 }, 44),
    ).toBe(false);
    expect(
      isCollapsedPanelSize({ asPercentage: 40, inPixels: 480 }, 44),
    ).toBe(false);
  });
});

describe("usableStoredSize", () => {
  it("keeps a stored size", () => {
    expect(usableStoredSize("60%", "40%")).toBe("60%");
    expect(usableStoredSize("256px", "300px")).toBe("256px");
  });

  /** Recovery path for widths stored as `NaN%` before the NaN reports were filtered. */
  it("falls back when the stored size has no number in it", () => {
    expect(usableStoredSize("NaN%", "40%")).toBe("40%");
    expect(usableStoredSize("", "40%")).toBe("40%");
  });
});

describe("complementaryPercentage", () => {
  it("returns the other panel's share so both defaultSizes add to 100%", () => {
    expect(complementaryPercentage("33%", "60%")).toBe("67%");
    expect(complementaryPercentage("75%", "40%")).toBe("25%");
  });

  it("falls back when the size is not a percentage", () => {
    expect(complementaryPercentage("256px", "60%")).toBe("60%");
    expect(complementaryPercentage("nope", "40%")).toBe("40%");
  });
});

const rawSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "usePersistentPanelSize.ts"),
  "utf8",
);

/** Comments here name the very APIs the assertions below rule out. */
const source = rawSource
  .replace(/\/\*\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/**
 * The dragged width used to live in a ref, so every reload — and every
 * collapse/re-expand — snapped the split back to the default. It has to be
 * persisted, and the collapsed flag alone is not enough.
 */
it("persists the size rather than keeping it in a ref", () => {
  expect(source).toContain("useLocalStorage(");
  expect(source).toContain("`${storageKey}:size`");
});

/**
 * A panel's `onResize` fires on every frame of the drag; the group's
 * `onLayoutChanged` fires once on pointer release. Persisting from the former
 * would be a storage write per frame.
 */
it("persists from onLayoutChanged, not a per-frame onResize", () => {
  expect(source).toContain("onLayoutChanged");
  expect(source).not.toContain("onResize");
});

/**
 * A saved `Layout` is keyed by panel id, so the ids have to be stable across
 * mounts — the library's `useId` fallback is not, which makes a stored layout
 * unreadable on the next mount.
 */
it("exports stable panel ids for the saved layout to key on", () => {
  expect(LEFT_PANEL_ID).toBe("left");
  expect(RIGHT_PANEL_ID).toBe("right");
  expect(TOP_PANEL_ID).toBe("top");
  expect(BOTTOM_PANEL_ID).toBe("bottom");
});

/**
 * The group reports its starting layout from a layout effect, and effects run
 * child-first — so it fires before this hook's own effect, while
 * `useLocalStorage`'s setter is still a stub that throws.
 */
it("guards the group's first layout report", () => {
  expect(source).toContain("if (!isMounted.current) return;");
});

/**
 * Every `onResize` consumer has to drop the NaN report a hidden panel makes.
 * Without it the handler's collapsed state disagrees with the panel it mirrors,
 * which is what made the sandbox toggle stop responding after a session switch.
 */
it.each([
  "../components/ResizablePanelLayout.tsx",
  "../components/sandbox/SandboxWorkspace.tsx",
])("filters hidden-panel resize reports in %s", (relativePath) => {
  const consumer = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), relativePath),
    "utf8",
  );
  expect(consumer).toContain("if (!isMeasuredPanelSize(size)) return;");
});

/**
 * The library keeps one global registry of mounted groups and resolves every
 * lookup by id to the *first* match — imperative resize/collapse, the rendered
 * flexGrow, the layout-change listener. Passing the (shared) `storageKey` as the
 * group id meant the three kept-alive session shells all answered to
 * `sandbox-collapsed`, so the visible session drove the oldest hidden one: its
 * 0px group turned a 44px collapse into 0% (rail gone) and the re-expand was a
 * no-op. Panel ids stay explicit; only the group id must be per-instance.
 */
it.each([
  "../components/ResizablePanelLayout.tsx",
  "../components/ResizableSidebar.tsx",
])("gives each mounted group its own id in %s", (relativePath) => {
  const consumer = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), relativePath),
    "utf8",
  );
  expect(consumer).not.toContain("id={storageKey}");
});
