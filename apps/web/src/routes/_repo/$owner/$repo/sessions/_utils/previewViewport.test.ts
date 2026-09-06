import { describe, expect, test } from "vitest";
import {
  clampPreviewViewportSize,
  migrateLegacyPreviewDevice,
  parsePreviewContainSize,
  parsePreviewViewport,
  presetViewport,
  previewIframeScale,
  resizePreviewViewport,
  rotatePreviewViewport,
  serializePreviewContainSize,
  serializePreviewViewport,
  snapshotFillViewport,
} from "./previewViewport";

describe("preview viewport", () => {
  test("parses a stored freeform size and rejects junk", () => {
    expect(
      parsePreviewViewport(
        serializePreviewViewport({
          mode: "freeform",
          width: 1280,
          height: 800,
        }),
      ),
    ).toEqual({ mode: "freeform", width: 1280, height: 800 });
    expect(parsePreviewViewport("nope")).toEqual({ mode: "fill" });
    expect(parsePreviewViewport('{"mode":"preset","id":"nokia"}')).toEqual({
      mode: "fill",
    });
  });

  test("migrates the old desktop/tablet/mobile toggle", () => {
    expect(migrateLegacyPreviewDevice("desktop")).toEqual({ mode: "fill" });
    expect(migrateLegacyPreviewDevice("tablet")).toEqual(
      presetViewport("ipad-mini"),
    );
    expect(migrateLegacyPreviewDevice("mobile")).toEqual(
      presetViewport("iphone-12-pro"),
    );
  });

  test("rotate swaps sides and keeps the preset", () => {
    const phone = presetViewport("iphone-12-pro");
    expect(phone).toEqual({
      mode: "preset",
      id: "iphone-12-pro",
      width: 390,
      height: 844,
    });
    expect(rotatePreviewViewport(phone)).toEqual({
      mode: "preset",
      id: "iphone-12-pro",
      width: 844,
      height: 390,
    });
    expect(presetViewport("iphone-12-pro", "landscape")).toEqual({
      mode: "preset",
      id: "iphone-12-pro",
      width: 844,
      height: 390,
    });
  });

  test("aspect-locked resize keeps the ratio", () => {
    const next = resizePreviewViewport(
      { width: 400, height: 200 },
      { x: 200, y: 0 },
      "east",
      2,
    );
    expect(next.width / next.height).toBeCloseTo(2);
    expect(next.width).toBeGreaterThan(400);
  });

  test("snapshots fill from the live panel, clamped", () => {
    expect(snapshotFillViewport({ width: 980.4, height: 640.9 })).toEqual({
      mode: "freeform",
      width: 980,
      height: 641,
    });
    expect(snapshotFillViewport({ width: 12, height: 12 })).toEqual({
      mode: "freeform",
      width: 240,
      height: 240,
    });
  });

  test("scales the guest iframe so the logical viewport fits the panel", () => {
    expect(
      previewIframeScale({ width: 195, height: 422 }, { width: 390, height: 844 }),
    ).toBe(0.5);
    expect(
      previewIframeScale({ width: 800, height: 600 }, { width: 390, height: 844 }),
    ).toBeCloseTo(600 / 844);
  });

  test("clamps area so a drag cannot explode memory", () => {
    const huge = clampPreviewViewportSize({ width: 3840, height: 3840 });
    expect(huge.width * huge.height).toBeLessThanOrEqual(3840 * 2160);
  });

  test("round-trips a contain size and rejects junk", () => {
    expect(
      parsePreviewContainSize(
        serializePreviewContainSize({ width: 1280, height: 720 }),
      ),
    ).toEqual({ width: 1280, height: 720 });
    expect(parsePreviewContainSize("nope")).toEqual({
      width: 1280,
      height: 800,
    });
  });

  /**
   * The contain size is read back out of sessionStorage, so a stale entry from
   * an older build, or one edited by hand, is well-formed JSON of the wrong
   * shape. Coercion made each of these NaN, and the clamp floors NaN to the
   * 240px minimum — the preview letterboxed to a 240×240 stamp and, because the
   * bad value stays on disk, kept doing it on every reload. Well-formed JSON is
   * the case that survives `JSON.parse`, so the try/catch alone never caught it.
   */
  test.each([
    ["strings instead of numbers", '{"width":"1280","height":"800"}'],
    ["a missing height", '{"width":1280}'],
    ["an unrelated shape", '{"mode":"fill"}'],
    ["a bare number", "5"],
    ["null", "null"],
    ["an array", "[1280,800]"],
    ["a non-finite width", '{"width":1e999,"height":800}'],
  ])("falls back to the desktop frame for %s", (_label, raw) => {
    expect(parsePreviewContainSize(raw)).toEqual({ width: 1280, height: 800 });
  });

  test("still clamps a real but out-of-range stored size", () => {
    // Numbers we can trust are clamped, not discarded — only the shape is fatal.
    expect(parsePreviewContainSize('{"width":10,"height":10}')).toEqual({
      width: 240,
      height: 240,
    });
  });
});
