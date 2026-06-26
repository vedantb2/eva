"use client";

import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import type { BlockProps } from "../types";

const plugins = { cjk, math };

export function CalloutBlock({
  data,
  readOnly,
  onChange,
}: BlockProps<"callout">) {
  const toneClass =
    data.tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5"
      : data.tone === "decision"
        ? "border-primary/40 bg-primary/5"
        : "border-border bg-muted/30";

  if (readOnly) {
    return (
      <div className={`rounded-surface border p-3 ${toneClass}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Streamdown plugins={plugins}>
            {data.markdown || "_Empty callout_"}
          </Streamdown>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-surface border p-3 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="callout-tone">
          Tone
        </label>
        <select
          id="callout-tone"
          className="rounded-surface border border-border bg-background px-2 py-1 text-xs"
          value={data.tone}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "info" || value === "warn" || value === "decision") {
              onChange({ ...data, tone: value });
            }
          }}
        >
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="decision">Decision</option>
        </select>
      </div>
      <textarea
        className="min-h-24 w-full rounded-surface border border-border bg-background px-3 py-2 text-sm"
        value={data.markdown}
        onChange={(event) =>
          onChange({ ...data, markdown: event.target.value })
        }
        placeholder="Callout markdown…"
      />
    </div>
  );
}
