import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BOTTOM_PANEL_ID,
  LEFT_PANEL_ID,
  complementaryPercentage,
  panelPercentage,
  RIGHT_PANEL_ID,
  TOP_PANEL_ID,
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

  /** Collapsed is tracked separately; 0 is not a width worth returning to. */
  it("reports 0 for a collapsed panel so callers can skip persisting it", () => {
    expect(
      panelPercentage({ [LEFT_PANEL_ID]: 100, [RIGHT_PANEL_ID]: 0 }, "right"),
    ).toBe(0);
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
