"use client";

import type { BlockProps, FileTreeChange } from "../types";

const CHANGE_LABEL: Record<FileTreeChange, string> = {
  added: "A",
  modified: "M",
  removed: "R",
  renamed: "→",
};

const CHANGE_CLASS: Record<FileTreeChange, string> = {
  added: "text-green-600 dark:text-green-400",
  modified: "text-amber-600 dark:text-amber-400",
  removed: "text-red-600 dark:text-red-400",
  renamed: "text-blue-600 dark:text-blue-400",
};

export function FileTreeBlock({
  data,
  readOnly,
  onChange,
}: BlockProps<"file-tree">) {
  if (readOnly) {
    return (
      <div className="rounded-surface border border-border p-3 font-mono text-xs">
        {data.entries.length === 0 ? (
          <p className="text-muted-foreground">No files listed.</p>
        ) : (
          <ul className="space-y-1">
            {data.entries.map((entry) => (
              <li key={entry.path} className="flex items-start gap-2">
                <span
                  className={`w-4 shrink-0 font-semibold ${CHANGE_CLASS[entry.change]}`}
                >
                  {CHANGE_LABEL[entry.change]}
                </span>
                <span className="min-w-0 flex-1 break-all">{entry.path}</span>
                {entry.note ? (
                  <span className="text-muted-foreground">{entry.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const text = data.entries
    .map(
      (entry) =>
        `${entry.change}\t${entry.path}${entry.note ? `\t${entry.note}` : ""}`,
    )
    .join("\n");

  return (
    <div className="rounded-surface border border-border p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        One entry per line: change, path, optional note (tab-separated).
        Changes: added, modified, removed, renamed.
      </p>
      <textarea
        className="min-h-32 w-full rounded-surface border border-border bg-background px-2 py-1 font-mono text-xs"
        value={text}
        onChange={(event) => {
          const entries = event.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [changeRaw, path, note] = line.split("\t");
              const change = parseChange(changeRaw ?? "");
              if (!change || !path) return null;
              return note ? { path, change, note } : { path, change };
            })
            .filter(
              (entry): entry is NonNullable<typeof entry> => entry !== null,
            );
          onChange({ entries });
        }}
        placeholder={"added\tapps/web/src/App.tsx\tNew route"}
      />
    </div>
  );
}

function parseChange(value: string): FileTreeChange | null {
  if (
    value === "added" ||
    value === "modified" ||
    value === "removed" ||
    value === "renamed"
  ) {
    return value;
  }
  return null;
}
