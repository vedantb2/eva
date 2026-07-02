"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SearchInput,
  Spinner,
  cn,
} from "@conductor/ui";
import { IconAlertTriangle, IconFileText } from "@tabler/icons-react";
import { compactRelativeTime } from "@conductor/shared/dates";
import { useQueryState } from "nuqs";
import { branchParser, searchParser } from "@/lib/search-params";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

interface TestingArenaSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function TestingArenaSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: TestingArenaSidebarProps) {
  const docs = useQuery(api.docs.list, { repoId });
  const startEvaluation = useMutation(api.evaluationWorkflow.startEvaluation);

  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const [branch] = useQueryState("branch", branchParser);
  const [showTestAllModal, setShowTestAllModal] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  useEffect(() => {
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    setShowTestAllModal(true);
  }, [createRequestId]);

  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const q = searchQuery.toLowerCase().trim();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs;
  }, [docs, searchQuery]);

  // Only docs with requirements can be evaluated; the rest are skipped.
  const testableDocs = useMemo(
    () => (docs ?? []).filter((d) => (d.requirements?.length ?? 0) > 0),
    [docs],
  );

  const handleTestAll = async () => {
    setShowTestAllModal(false);
    if (testableDocs.length === 0) return;
    setIsTestingAll(true);
    try {
      for (const doc of testableDocs) {
        // One failure should not abort the whole batch.
        try {
          await startEvaluation({
            docId: doc._id,
            repoId,
            branchName: branch !== "main" ? branch : undefined,
          });
        } catch {
          // Skip this doc and continue with the rest.
        }
      }
    } finally {
      setIsTestingAll(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search docs..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v || null)}
          onClear={() => setSearchQuery(null)}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-warning"
          onClick={() => setShowTestAllModal(true)}
          title="Test all documents"
        >
          <IconAlertTriangle size={16} />
        </Button>
      </div>

      <div className="flex-1">
        {docs === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-4 text-center">
            <IconFileText
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create docs to test against
            </p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          <SharedLayoutNav layoutId="testing-arena-nav" className="space-y-1">
            {filteredDocs.map((doc) => {
              const href = `${basePath}/testing-arena/${doc._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <SharedLayoutNavSurface
                  key={doc._id}
                  itemId={doc._id}
                  isActive={isSelected}
                  className="group"
                >
                  <Link
                    to={href}
                    onClick={onNavigate}
                    className={sidebarNavLinkClass(isSelected)}
                  >
                    <IconFileText
                      size={16}
                      className={cn(
                        "shrink-0",
                        isSelected
                          ? "text-sidebar-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <MarqueeOnHover className="min-w-0 flex-1">
                      {doc.title}
                    </MarqueeOnHover>
                    <span
                      className={cn(
                        "shrink-0 overflow-hidden whitespace-nowrap text-xs tabular-nums text-muted-foreground transition-[max-width,opacity,padding] duration-150",
                        isSelected
                          ? "max-w-[80px] pl-2 opacity-100"
                          : "max-w-0 pl-0 opacity-0 group-hover:max-w-[80px] group-hover:pl-2 group-hover:opacity-100",
                      )}
                    >
                      {compactRelativeTime(doc.updatedAt ?? doc._creationTime)}
                    </span>
                  </Link>
                </SharedLayoutNavSurface>
              );
            })}
          </SharedLayoutNav>
        )}
      </div>

      <Dialog
        open={showTestAllModal}
        onOpenChange={(v) => {
          if (!v) setShowTestAllModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test all documents</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Run a code evaluation for each of the {testableDocs.length} document
            {testableDocs.length === 1 ? "" : "s"} with requirements?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Each runs against your codebase sequentially. Documents without
            requirements are skipped.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTestAllModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTestAll}
              disabled={isTestingAll || testableDocs.length === 0}
            >
              {isTestingAll ? <Spinner size="sm" /> : "Run all tests"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
