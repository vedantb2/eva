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
  sidebarNavListItemClass,
} from "@/lib/components/sidebar/SharedLayoutNav";

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

  const handleTestAll = async () => {
    if (!docs || docs.length === 0) return;
    setShowTestAllModal(false);
    setIsTestingAll(true);
    try {
      for (const doc of docs) {
        await startEvaluation({
          docId: doc._id,
          repoId,
          branchName: branch !== "main" ? branch : undefined,
        });
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
          <SharedLayoutNav layoutId="testing-arena-nav">
            {filteredDocs.map((doc) => {
              const href = `${basePath}/testing-arena/${doc._id}`;
              const isSelected = pathname.startsWith(href);
              return (
                <SharedLayoutNavSurface
                  key={doc._id}
                  itemId={doc._id}
                  isActive={isSelected}
                  className="group mx-1"
                >
                  <Link
                    to={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center text-sm",
                      sidebarNavListItemClass(isSelected),
                    )}
                  >
                    <IconFileText size={14} className="mr-2.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                    <span
                      className={cn(
                        "shrink-0 overflow-hidden whitespace-nowrap text-xs tabular-nums text-muted-foreground transition-all duration-150",
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
            <DialogTitle>Test All Documents</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to run tests on all {docs?.length ?? 0}{" "}
            documents?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This will evaluate each document against your codebase sequentially.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTestAllModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestAll} disabled={isTestingAll}>
              {isTestingAll ? <Spinner size="sm" /> : "Yes save me Eva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
