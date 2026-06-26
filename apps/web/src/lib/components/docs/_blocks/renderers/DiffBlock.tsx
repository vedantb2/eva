"use client";

import { diffLines } from "diff";
import type { BlockProps } from "../types";

export function DiffBlock({ data, readOnly, onChange }: BlockProps<"diff">) {
  if (readOnly) {
    return (
      <div className="overflow-hidden rounded-surface border border-border">
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium">
          {data.filename}
          {data.summary ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {data.summary}
            </span>
          ) : null}
        </div>
        {data.mode === "unified" ? (
          <UnifiedDiff before={data.before} after={data.after} />
        ) : (
          <SplitDiff before={data.before} after={data.after} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-surface border border-border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          Filename
          <input
            className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
            value={data.filename}
            onChange={(event) =>
              onChange({ ...data, filename: event.target.value })
            }
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Language
          <input
            className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
            value={data.language}
            onChange={(event) =>
              onChange({ ...data, language: event.target.value })
            }
          />
        </label>
      </div>
      <label className="text-xs text-muted-foreground">
        Mode
        <select
          className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
          value={data.mode}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "split" || value === "unified") {
              onChange({ ...data, mode: value });
            }
          }}
        >
          <option value="split">Split</option>
          <option value="unified">Unified</option>
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          Before
          <textarea
            className="mt-1 min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
            value={data.before}
            onChange={(event) =>
              onChange({ ...data, before: event.target.value })
            }
          />
        </label>
        <label className="text-xs text-muted-foreground">
          After
          <textarea
            className="mt-1 min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
            value={data.after}
            onChange={(event) =>
              onChange({ ...data, after: event.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}

function SplitDiff({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid sm:grid-cols-2">
      <pre className="overflow-x-auto border-r border-border bg-red-500/5 p-3 text-xs leading-relaxed">
        {before}
      </pre>
      <pre className="overflow-x-auto bg-green-500/5 p-3 text-xs leading-relaxed">
        {after}
      </pre>
    </div>
  );
}

function UnifiedDiff({ before, after }: { before: string; after: string }) {
  const changes = diffLines(before, after);
  return (
    <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
      {changes.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              className="bg-green-500/20 text-green-700 dark:text-green-400"
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              className="bg-red-500/20 text-red-700 dark:text-red-400"
            >
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </pre>
  );
}
