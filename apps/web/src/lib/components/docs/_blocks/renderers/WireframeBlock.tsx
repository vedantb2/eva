"use client";

import type { BlockProps, WireframeSurface } from "../types";
import { sanitizeWireframeHtml } from "../sanitizeWireframeHtml";
import "../wireframe.css";

const SURFACE_CLASS: Record<WireframeSurface, string> = {
  browser: "eva-wireframe-frame--browser",
  desktop: "",
  mobile: "eva-wireframe-frame--mobile",
  popover: "",
  panel: "",
};

export function WireframeBlock({
  data,
  readOnly,
  onChange,
}: BlockProps<"wireframe">) {
  const frameClass = SURFACE_CLASS[data.surface];
  const skeletonClass = data.skeleton ? "skeleton" : "";

  if (readOnly) {
    return (
      <div
        className={`eva-wireframe eva-wireframe-frame ${frameClass} ${skeletonClass}`}
        dangerouslySetInnerHTML={{
          __html: sanitizeWireframeHtml(data.html),
        }}
      />
    );
  }

  return (
    <div className="space-y-2 rounded-surface border border-border p-3">
      <label className="text-xs text-muted-foreground">
        Surface
        <select
          className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
          value={data.surface}
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "browser" ||
              value === "desktop" ||
              value === "mobile" ||
              value === "popover" ||
              value === "panel"
            ) {
              onChange({ ...data, surface: value });
            }
          }}
        >
          <option value="browser">Browser</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="popover">Popover</option>
          <option value="panel">Panel</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={data.skeleton === true}
          onChange={(event) =>
            onChange({ ...data, skeleton: event.target.checked })
          }
        />
        Skeleton mode
      </label>
      <label className="text-xs text-muted-foreground">
        HTML
        <textarea
          className="mt-1 min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
          value={data.html}
          onChange={(event) => onChange({ ...data, html: event.target.value })}
        />
      </label>
    </div>
  );
}
