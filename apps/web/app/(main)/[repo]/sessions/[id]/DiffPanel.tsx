"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { IconFilePlus, IconFileCode, IconFileX } from "@tabler/icons-react";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type FileDiff = NonNullable<Session["fileDiffs"]>[number];

const statusConfig = {
  added: { icon: IconFilePlus, color: "text-green-500", label: "A" },
  modified: { icon: IconFileCode, color: "text-yellow-500", label: "M" },
  deleted: { icon: IconFileX, color: "text-red-500", label: "D" },
};

function getConfig(status: string) {
  return (
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.modified
  );
}

function DiffLine({ line }: { line: string }) {
  if (line.startsWith("+") && !line.startsWith("+++")) {
    return (
      <div className="bg-green-500/10 text-green-400 px-3 py-0">{line}</div>
    );
  }
  if (line.startsWith("-") && !line.startsWith("---")) {
    return <div className="bg-red-500/10 text-red-400 px-3 py-0">{line}</div>;
  }
  if (line.startsWith("@@")) {
    return <div className="text-blue-400 px-3 py-0">{line}</div>;
  }
  return <div className="text-muted-foreground px-3 py-0">{line}</div>;
}

export function DiffPanel({
  fileDiffs,
}: {
  fileDiffs: FileDiff[] | undefined;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!fileDiffs || fileDiffs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No file changes yet. Execute a task to see diffs.
      </div>
    );
  }

  const active = selectedFile ?? fileDiffs[0].file;
  const activeDiff = fileDiffs.find((d) => d.file === active);

  return (
    <div className="flex h-full">
      <div className="w-56 overflow-y-auto flex-shrink-0">
        {fileDiffs.map((d) => {
          const config = getConfig(d.status);
          const Icon = config.icon;
          return (
            <button
              key={d.file}
              onClick={() => setSelectedFile(d.file)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted ${
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
  );
}
