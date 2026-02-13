"use client";

import { useState, type ReactNode } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { IconFilePlus, IconFileCode, IconFileX } from "@tabler/icons-react";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type FileDiff = NonNullable<Session["fileDiffs"]>[number];

const statusConfig = {
  added: { icon: IconFilePlus, color: "text-success", label: "A" },
  modified: { icon: IconFileCode, color: "text-warning", label: "M" },
  deleted: { icon: IconFileX, color: "text-destructive", label: "D" },
};

function getConfig(status: string) {
  return (
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.modified
  );
}

function DiffLine({ line }: { line: string }) {
  if (line.startsWith("+") && !line.startsWith("+++")) {
    return <div className="bg-success/10 px-3 py-0 text-success">{line}</div>;
  }
  if (line.startsWith("-") && !line.startsWith("---")) {
    return (
      <div className="bg-destructive/10 px-3 py-0 text-destructive">{line}</div>
    );
  }
  if (line.startsWith("@@")) {
    return <div className="px-3 py-0 text-primary">{line}</div>;
  }
  return <div className="px-3 py-0 text-muted-foreground">{line}</div>;
}

export function DiffPanel({
  fileDiffs,
  tabSwitcher,
}: {
  fileDiffs: FileDiff[] | undefined;
  tabSwitcher?: ReactNode;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
      <div className="flex items-center gap-1 border-b p-2">{tabSwitcher}</div>
      <div className="flex flex-1 min-h-0">
        <div className="w-56 overflow-y-auto flex-shrink-0">
          {fileDiffs.map((d) => {
            const config = getConfig(d.status);
            const Icon = config.icon;
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
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto">
          {activeDiff ? (
            <pre className="text-xs font-mono leading-5">
              {activeDiff.diff.split("\n").map((line, i) => (
                <DiffLine key={i} line={line} />
              ))}
            </pre>
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
