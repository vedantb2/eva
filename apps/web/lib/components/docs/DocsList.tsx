"use client";

import { IconFile, IconFileText, IconSearch } from "@tabler/icons-react";
import { Input } from "@conductor/ui";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";

type Doc = FunctionReturnType<typeof api.docs.list>[number];

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
    return query
      ? docs.filter((d) => d.title.toLowerCase().includes(query))
      : docs;
  }, [docs, searchQuery]);

  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
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
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 pb-4">
        <div className="relative">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search docs..."
            className="h-8 text-sm pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-400">
            No matches found
          </div>
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
                    ? "bg-primary/10 text-primary"
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
