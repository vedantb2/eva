import { z } from "zod";

export const PREVIEW_VIEWPORT_MIN = 240;
export const PREVIEW_VIEWPORT_MAX = 3840;
export const PREVIEW_VIEWPORT_MAX_AREA = 3840 * 2160;
export const PREVIEW_VIEWPORT_RAIL_PX = 10;

export const PREVIEW_VIEWPORT_PRESET_IDS = [
  "iphone-se",
  "iphone-xr",
  "iphone-12-pro",
  "iphone-14-pro-max",
  "pixel-7",
  "samsung-galaxy-s8-plus",
  "samsung-galaxy-s20-ultra",
  "ipad-mini",
  "ipad-air",
  "ipad-pro",
  "surface-pro-7",
  "surface-duo",
  "galaxy-z-fold-5",
  "asus-zenbook-fold",
  "samsung-galaxy-a51-71",
  "nest-hub",
  "nest-hub-max",
] as const;

export type PreviewViewportPresetId =
  (typeof PREVIEW_VIEWPORT_PRESET_IDS)[number];

export type PreviewViewport =
  | { mode: "fill" }
  | { mode: "freeform"; width: number; height: number }
  | {
      mode: "preset";
      id: PreviewViewportPresetId;
      width: number;
      height: number;
    };

export type SizedPreviewViewport = Exclude<PreviewViewport, { mode: "fill" }>;

export type PreviewViewportResizeDirection = "east" | "south" | "southeast";

export interface PreviewViewportPreset {
  id: PreviewViewportPresetId;
  label: string;
  category: "Phone" | "Tablet";
  detail: string;
  width: number;
  height: number;
}

const PRESET_DEFINITIONS: Record<
  PreviewViewportPresetId,
  Omit<PreviewViewportPreset, "id">
> = {
  "iphone-se": {
    label: "iPhone SE",
    category: "Phone",
    detail: "375 × 667",
    width: 375,
    height: 667,
  },
  "iphone-xr": {
    label: "iPhone XR",
    category: "Phone",
    detail: "414 × 896",
    width: 414,
    height: 896,
  },
  "iphone-12-pro": {
    label: "iPhone 12 Pro",
    category: "Phone",
    detail: "390 × 844",
    width: 390,
    height: 844,
  },
  "iphone-14-pro-max": {
    label: "iPhone 14 Pro Max",
    category: "Phone",
    detail: "430 × 932",
    width: 430,
    height: 932,
  },
  "pixel-7": {
    label: "Pixel 7",
    category: "Phone",
    detail: "412 × 915",
    width: 412,
    height: 915,
  },
  "samsung-galaxy-s8-plus": {
    label: "Samsung Galaxy S8+",
    category: "Phone",
    detail: "360 × 740",
    width: 360,
    height: 740,
  },
  "samsung-galaxy-s20-ultra": {
    label: "Samsung Galaxy S20 Ultra",
    category: "Phone",
    detail: "412 × 915",
    width: 412,
    height: 915,
  },
  "ipad-mini": {
    label: "iPad Mini",
    category: "Tablet",
    detail: "768 × 1024",
    width: 768,
    height: 1024,
  },
  "ipad-air": {
    label: "iPad Air",
    category: "Tablet",
    detail: "820 × 1180",
    width: 820,
    height: 1180,
  },
  "ipad-pro": {
    label: "iPad Pro",
    category: "Tablet",
    detail: "1024 × 1366",
    width: 1024,
    height: 1366,
  },
  "surface-pro-7": {
    label: "Surface Pro 7",
    category: "Tablet",
    detail: "912 × 1368",
    width: 912,
    height: 1368,
  },
  "surface-duo": {
    label: "Surface Duo",
    category: "Phone",
    detail: "540 × 720",
    width: 540,
    height: 720,
  },
  "galaxy-z-fold-5": {
    label: "Galaxy Z Fold 5",
    category: "Phone",
    detail: "344 × 882",
    width: 344,
    height: 882,
  },
  "asus-zenbook-fold": {
    label: "Asus Zenbook Fold",
    category: "Tablet",
    detail: "853 × 1280",
    width: 853,
    height: 1280,
  },
  "samsung-galaxy-a51-71": {
    label: "Samsung Galaxy A51/71",
    category: "Phone",
    detail: "412 × 914",
    width: 412,
    height: 914,
  },
  "nest-hub": {
    label: "Nest Hub",
    category: "Tablet",
    detail: "1024 × 600",
    width: 1024,
    height: 600,
  },
  "nest-hub-max": {
    label: "Nest Hub Max",
    category: "Tablet",
    detail: "1280 × 800",
    width: 1280,
    height: 800,
  },
};

export const PREVIEW_VIEWPORT_PRESETS: ReadonlyArray<PreviewViewportPreset> =
  PREVIEW_VIEWPORT_PRESET_IDS.map((id) => ({
    id,
    ...PRESET_DEFINITIONS[id],
  }));

export const FILL_PREVIEW_VIEWPORT: PreviewViewport = { mode: "fill" };

const sizeSchema = z.object({
  width: z
    .number()
    .int()
    .min(PREVIEW_VIEWPORT_MIN)
    .max(PREVIEW_VIEWPORT_MAX),
  height: z
    .number()
    .int()
    .min(PREVIEW_VIEWPORT_MIN)
    .max(PREVIEW_VIEWPORT_MAX),
});

const previewViewportSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("fill") }),
  z.object({
    mode: z.literal("freeform"),
    width: sizeSchema.shape.width,
    height: sizeSchema.shape.height,
  }),
  z.object({
    mode: z.literal("preset"),
    id: z.enum(PREVIEW_VIEWPORT_PRESET_IDS),
    width: sizeSchema.shape.width,
    height: sizeSchema.shape.height,
  }),
]);

export function serializePreviewViewport(viewport: PreviewViewport): string {
  return JSON.stringify(viewport);
}

export function parsePreviewViewport(raw: string): PreviewViewport {
  try {
    const parsed = previewViewportSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return FILL_PREVIEW_VIEWPORT;
    if (parsed.data.mode === "fill") return parsed.data;
    if (parsed.data.width * parsed.data.height > PREVIEW_VIEWPORT_MAX_AREA) {
      return FILL_PREVIEW_VIEWPORT;
    }
    return parsed.data;
  } catch {
    return FILL_PREVIEW_VIEWPORT;
  }
}

export function migrateLegacyPreviewDevice(raw: string): PreviewViewport {
  if (raw === "tablet") {
    return presetViewport("ipad-mini");
  }
  if (raw === "mobile") {
    return presetViewport("iphone-12-pro");
  }
  return FILL_PREVIEW_VIEWPORT;
}

export function readStoredPreviewViewport(
  viewportKey: string,
  legacyDeviceKey: string,
): PreviewViewport {
  try {
    const stored = sessionStorage.getItem(viewportKey);
    if (stored !== null) return parsePreviewViewport(stored);
    const legacy = sessionStorage.getItem(legacyDeviceKey);
    if (legacy === null) return FILL_PREVIEW_VIEWPORT;
    const migrated = migrateLegacyPreviewDevice(legacy);
    sessionStorage.setItem(viewportKey, serializePreviewViewport(migrated));
    sessionStorage.removeItem(legacyDeviceKey);
    return migrated;
  } catch {
    return FILL_PREVIEW_VIEWPORT;
  }
}

export function findPreviewViewportPreset(
  id: string,
): PreviewViewportPreset | undefined {
  return PREVIEW_VIEWPORT_PRESETS.find((preset) => preset.id === id);
}

export function presetViewport(
  id: PreviewViewportPresetId,
  orientation?: "portrait" | "landscape",
): SizedPreviewViewport {
  const preset = PRESET_DEFINITIONS[id];
  const nativePortrait = preset.height >= preset.width;
  const landscape = orientation === "landscape";
  const portrait = orientation === "portrait";
  const shouldSwap =
    (landscape && nativePortrait) || (portrait && !nativePortrait);
  return {
    mode: "preset",
    id,
    width: shouldSwap ? preset.height : preset.width,
    height: shouldSwap ? preset.width : preset.height,
  };
}

export function clampPreviewDimension(value: number): number {
  if (!Number.isFinite(value)) return PREVIEW_VIEWPORT_MIN;
  return Math.min(
    PREVIEW_VIEWPORT_MAX,
    Math.max(PREVIEW_VIEWPORT_MIN, Math.round(value)),
  );
}

export function clampPreviewViewportSize(size: {
  width: number;
  height: number;
}): { width: number; height: number } {
  let width = clampPreviewDimension(size.width);
  let height = clampPreviewDimension(size.height);
  if (width * height <= PREVIEW_VIEWPORT_MAX_AREA) return { width, height };
  const scale = Math.sqrt(PREVIEW_VIEWPORT_MAX_AREA / (width * height));
  width = clampPreviewDimension(width * scale);
  height = clampPreviewDimension(height * scale);
  if (width * height > PREVIEW_VIEWPORT_MAX_AREA) {
    height = Math.max(
      PREVIEW_VIEWPORT_MIN,
      Math.floor(PREVIEW_VIEWPORT_MAX_AREA / width),
    );
  }
  return { width, height };
}

export function snapshotFillViewport(rect: {
  width: number;
  height: number;
}): SizedPreviewViewport {
  const size = clampPreviewViewportSize({
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  });
  return { mode: "freeform", ...size };
}

export function rotatePreviewViewport(
  viewport: SizedPreviewViewport,
): SizedPreviewViewport {
  return {
    ...viewport,
    width: viewport.height,
    height: viewport.width,
  };
}

export function previewViewportAspectRatio(
  viewport: SizedPreviewViewport,
): number {
  return viewport.width / viewport.height;
}

function resizeAtAspectRatio(
  desired: number,
  aspectRatio: number,
  primaryAxis: "width" | "height",
): { width: number; height: number } {
  if (primaryAxis === "width") {
    const width = clampPreviewDimension(desired);
    const height = clampPreviewDimension(width / aspectRatio);
    return clampPreviewViewportSize({ width, height });
  }
  const height = clampPreviewDimension(desired);
  const width = clampPreviewDimension(height * aspectRatio);
  return clampPreviewViewportSize({ width, height });
}

export function resizePreviewViewport(
  start: { width: number; height: number },
  delta: { x: number; y: number },
  direction: PreviewViewportResizeDirection,
  aspectRatio: number | null,
): { width: number; height: number } {
  const horizontal = direction === "south" ? 0 : delta.x;
  const vertical = direction === "east" ? 0 : delta.y;
  const desiredWidth = start.width + horizontal;
  const desiredHeight = start.height + vertical;
  if (aspectRatio !== null && Number.isFinite(aspectRatio) && aspectRatio > 0) {
    const controlsWidth = direction !== "south";
    const controlsHeight = direction !== "east";
    const primaryAxis =
      controlsWidth && !controlsHeight
        ? "width"
        : controlsHeight && !controlsWidth
          ? "height"
          : Math.abs(desiredWidth - start.width) / start.width >=
              Math.abs(desiredHeight - start.height) / start.height
            ? "width"
            : "height";
    return resizeAtAspectRatio(
      primaryAxis === "width" ? desiredWidth : desiredHeight,
      aspectRatio,
      primaryAxis,
    );
  }
  return clampPreviewViewportSize({
    width: desiredWidth,
    height: desiredHeight,
  });
}

export function previewIframeScale(
  visual: { width: number; height: number },
  logical: { width: number; height: number },
): number {
  if (logical.width <= 0 || logical.height <= 0) return 1;
  const scale = Math.min(
    visual.width / logical.width,
    visual.height / logical.height,
  );
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

export function fittedPreviewContainStyle(logical: {
  width: number;
  height: number;
}): {
  width: string;
  height: string;
} {
  return {
    width: `min(100cqw, ${logical.width}px, calc(100cqh * ${logical.width} / ${logical.height}))`,
    height: `min(100cqh, ${logical.height}px, calc(100cqw * ${logical.height} / ${logical.width}))`,
  };
}

export function previewViewportLabel(viewport: PreviewViewport): string {
  if (viewport.mode === "fill") return "Fill panel";
  if (viewport.mode === "preset") {
    const preset = PRESET_DEFINITIONS[viewport.id];
    return preset.label;
  }
  return "Responsive";
}

export function sizedPreviewViewport(
  viewport: PreviewViewport,
): SizedPreviewViewport | null {
  return viewport.mode === "fill" ? null : viewport;
}
