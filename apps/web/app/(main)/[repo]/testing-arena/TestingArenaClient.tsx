"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
} from "@conductor/ui";
import { IconFileText, IconSearch, IconX } from "@tabler/icons-react";
import { useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import { searchParser } from "@/lib/search-params";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Id } from "@conductor/backend";

interface Doc {
  _id: Id<"docs">;
  title: string;
}

function DocsListPanel({
  docs,
  repoSlug,
}: {
  docs: Doc[] | undefined;
  repoSlug: string;
}) {
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
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
        <IconFileText size={32} className="mb-2" />
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Create docs to test against</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 relative">
        <IconSearch
          size={14}
          className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search docs..."
          className="pl-8 pr-8 h-8 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value || null)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery(null)}
            className="absolute right-7 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          >
            <IconX size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const href = `/${repoSlug}/testing-arena/${doc._id}`;
            const isSelected = pathname.startsWith(href);
            return (
              <Link
                key={doc._id}
                href={href}
                className={`text-left p-3 mx-1.5 rounded-md transition-colors duration-150 flex items-center gap-3 ${
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

export function TestingArenaClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { repo, repoSlug } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [showTestAllModal, setShowTestAllModal] = useState(false);

  const handleTestAll = async () => {
    if (!docs || docs.length === 0) return;
    setShowTestAllModal(false);
    setIsTestingAll(true);
    try {
      for (const doc of docs) {
        await fetch("/api/inngest/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "testing-arena/evaluate.doc",
            data: { docId: doc._id, repoId: repo._id },
          }),
        });
      }
    } finally {
      setIsTestingAll(false);
    }
  };

  return (
    <>
      <SidebarLayoutWrapper
        title="Testing Arena"
        onAdd={() => setShowTestAllModal(true)}
        sidebar={<DocsListPanel docs={docs} repoSlug={repoSlug} />}
      >
        {children}
      </SidebarLayoutWrapper>
      <Dialog
        open={showTestAllModal}
        onOpenChange={(v) => {
          if (!v) setShowTestAllModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test All Documents</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-muted-foreground">
              Are you sure you want to run tests on all {docs?.length ?? 0}{" "}
              documents?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This will evaluate each document against your codebase
              sequentially.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTestAllModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestAll}>Yes save me Eva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
