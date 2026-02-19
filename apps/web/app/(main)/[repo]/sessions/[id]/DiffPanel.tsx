"use client";

import { useState, type ReactNode } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
  IconFilePlus,
  IconFileCode,
  IconFileX,
  IconLayoutRows,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { PatchDiff } from "@pierre/diffs/react";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type FileDiff = NonNullable<Session["fileDiffs"]>[number];
type DiffStyle = "unified" | "split";

const statusConfig = {
  added: { icon: IconFilePlus, color: "text-success", label: "A" },
  modified: { icon: IconFileCode, color: "text-warning", label: "M" },
  deleted: { icon: IconFileX, color: "text-destructive", label: "D" },
} satisfies Record<
  string,
  { icon: typeof IconFilePlus; color: string; label: string }
>;

function isValidStatus(status: string): status is keyof typeof statusConfig {
  return status in statusConfig;
}

function getConfig(status: string) {
  if (isValidStatus(status)) {
    return statusConfig[status];
  }
  return statusConfig.modified;
}

function countPatchStats(patch: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) added++;
    else if (line.startsWith("-") && !line.startsWith("---")) removed++;
  }
  return { added, removed };
}

export function DiffPanel({
  fileDiffs,
  tabSwitcher,
}: {
  fileDiffs: FileDiff[] | undefined;
  tabSwitcher?: ReactNode;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffStyle, setDiffStyle] = useState<DiffStyle>("unified");

  if (!fileDiffs || fileDiffs.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1 border-b p-2">
          {tabSwitcher}
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No file changes yet. Execute a task to see diffs.
        </div>
      </div>
    );
  }

  const active = selectedFile ?? fileDiffs[0].file;
  const activeDiff = fileDiffs.find((d) => d.file === active);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 border-b p-2">
        {tabSwitcher}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => setDiffStyle("unified")}
            className={`p-1 rounded ${diffStyle === "unified" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Unified view"
          >
            <IconLayoutRows className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDiffStyle("split")}
            className={`p-1 rounded ${diffStyle === "split" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Split view"
          >
            <IconLayoutColumns className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-56 overflow-y-auto flex-shrink-0">
          {fileDiffs.map((d) => {
            const config = getConfig(d.status);
            const Icon = config.icon;
            const stats = countPatchStats(d.diff);
            return (
              <button
                key={d.file}
                onClick={() => setSelectedFile(d.file)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                  active === d.file ? "bg-muted" : ""
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${config.color}`} />
                <span className="truncate text-muted-foreground">{d.file}</span>
                <span className="ml-auto flex items-center gap-1 flex-shrink-0 text-[10px] font-mono">
                  <span className="text-success">+{stats.added}</span>
                  <span className="text-destructive">-{stats.removed}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto">
          {activeDiff ? (
            <PatchDiff
              patch={activeDiff.diff}
              options={{
                diffStyle,
                diffIndicators: "bars",
                overflow: "scroll",
                themeType: "system",
                disableFileHeader: true,
                lineDiffType: "word",
                expandUnchanged: true,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
