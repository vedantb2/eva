"use client";

import { GenericId as Id } from "convex/values";
import { IconFile, IconFileText } from "@tabler/icons-react";

interface Doc {
  _id: Id<"docs">;
  title: string;
  updatedAt: number;
}

interface DocsListProps {
  docs: Doc[] | undefined;
  selectedId: Id<"docs"> | null;
  onSelect: (id: Id<"docs">) => void;
}

export function DocsList({ docs, selectedId, onSelect }: DocsListProps) {
  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <IconFile size={32} className="mb-2" />
        <p className="text-sm">No documents yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="p-2 space-y-1">
        {docs.map((doc) => (
          <button
            key={doc._id}
            type="button"
            onClick={() => onSelect(doc._id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedId === doc._id
                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <IconFileText size={16} className="flex-shrink-0" />
            <span className="truncate text-sm">{doc.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
