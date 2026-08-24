import { describe, expect, test } from "vitest";
import {
  clampPreviewViewportSize,
  migrateLegacyPreviewDevice,
  parsePreviewViewport,
  presetViewport,
  previewIframeScale,
  resizePreviewViewport,
  rotatePreviewViewport,
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
});
