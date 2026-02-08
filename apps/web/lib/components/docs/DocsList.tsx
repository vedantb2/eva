"use client";

import { IconFile, IconFileText, IconSearch } from "@tabler/icons-react";
import { Input, Spinner } from "@conductor/ui";
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
        <Spinner />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
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
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const href = `/${repoSlug}/docs/${doc._id}`;
            const isSelected = pathname.startsWith(href);
            return (
              <Link
                key={doc._id}
                href={href}
                className={`mx-2 text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                  isSelected
                    ? "bg-accent text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
