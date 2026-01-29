"use client";

import { GenericId as Id } from "convex/values";
import { IconFile, IconFileText, IconSearch } from "@tabler/icons-react";
import { Input } from "@heroui/input";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Doc {
  _id: Id<"docs">;
  title: string;
  updatedAt: number;
}

interface DocsListProps {
  docs: Doc[] | undefined;
  repoSlug: string;
}

export function DocsList({ docs, repoSlug }: DocsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const query = searchQuery.toLowerCase().trim();
    return query ? docs.filter((d) => d.title.toLowerCase().includes(query)) : docs;
  }, [docs, searchQuery]);

  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
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
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      <div className="px-4 py-2">
        <Input
          placeholder="Search docs..."
          startContent={<IconSearch size={14} className="text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery("")}
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-400">No matches found</div>
        ) : (
          filteredDocs.map((doc) => {
            const href = `/${repoSlug}/docs/${doc._id}`;
            const isSelected = pathname === href;
            return (
              <Link
                key={doc._id}
                href={href}
                className={`w-full text-left px-5 py-3 transition-colors flex items-center gap-3 ${
                  isSelected
                    ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <IconFileText size={16} className="flex-shrink-0" />
                <span className="truncate text-sm">{doc.title}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
