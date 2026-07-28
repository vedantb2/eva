import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

// Regression guard for the accent fallback fix (commit 0244c281).
//
// A stored accent can outlive the build that defined it: `main` ships 11
// accents, `staging` ships 26, and both are live at once. Picking a
// staging-only accent and then loading a `main` deploy used to index
// `ACCENT_COLORS[accentColor]` directly and read `.light` off the miss, which
// threw during render and dropped the whole app to the error boundary over a
// colour.
//
// The fix routes every accent lookup through `lookupAccent`, which returns via
// a `Partial<typeof ACCENT_COLORS>` view so the miss is `undefined` in the type
// system, and both call sites fall back instead of reading channels off it.
// These are disk-read contract checks (matching the suite's other *Contract
// tests) because the logic lives in a `"use client"` module that pulls Convex
// and cannot be imported in the node test environment.
//
// This whole file is safe to delete once `staging` and `main` ship the same
// accents — see the CLEAN UP note on `lookupAccent` in ThemeContext.tsx.

const here = dirname(fileURLToPath(import.meta.url));

const themeContextSource = readFileSync(join(here, "ThemeContext.tsx"), "utf8");

const themePreviewSource = readFileSync(
  join(here, "..", "components", "theme", "_components", "ThemePreview.tsx"),
  "utf8",
);

test("lookupAccent surfaces the miss to the type system via a Partial view", () => {
  // A direct `ACCENT_COLORS[accentColor]` index is typed as always-present and
  // is what threw. The Partial view is what makes `undefined` reachable and
  // forces callers to handle it; losing it reintroduces the crash.
  expect(themeContextSource).toContain("Partial<typeof ACCENT_COLORS>");
});

test("applyCustomThemeVars falls back when the stored accent is undefined", () => {
  // Must look the accent up through lookupAccent and bail out before reading
  // any colour channel off the result.
  expect(themeContextSource).toContain("lookupAccent(accentColor)");
  expect(themeContextSource).toContain("if (colors === undefined)");
});

test("ThemePreview guards the accent before reading its colours", () => {
  expect(themePreviewSource).toContain("lookupAccent");
  expect(themePreviewSource).toContain("accent === undefined");
});
