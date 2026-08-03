"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { Id } from "@eva/backend";
import type { GitStatus } from "@pierre/trees";
import { Accordion, EmptyState, Spinner } from "@eva/ui";
import { IconGitPullRequest, IconAlertTriangle } from "@tabler/icons-react";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { ResizableSidebar } from "@/lib/components/ResizableSidebar";
import { DiffFileTree } from "./DiffFileTree";
import { DiffFileAccordionItem } from "./DiffFileAccordionItem";
import { DiffsToolbar } from "./DiffsToolbar";
import { SubmitReviewPopover } from "./SubmitReviewPopover";
import { prNumberFromGithubUrl } from "@/lib/githubPr";
import { useDiffSearchParams } from "./useDiffSearchParams";
import { useDiffViewedFiles } from "./useDiffViewedFiles";
import { usePrDiff } from "./usePrDiff";

interface DiffsPanelProps {
  /** PR URL for the current surface; absent when no PR exists yet. */
  prUrl?: string;
  repoId: Id<"githubRepos">;
}

/**
 * Sandbox "Diffs" tab. Renders the pushed PR diff (from GitHub) with
 * `@pierre/diffs`, in unified or split view, alongside a clickable
 * `@pierre/trees` file tree on the left for jumping straight to a file's diff.
 * Each file sits in a collapsible accordion with a GitHub-style Viewed checkbox
 * (persisted per PR in localStorage). The toolbar above owns the review chrome,
 * so every surface embedding this panel gets the same controls.
 */
export function DiffsPanel({ prUrl, repoId }: DiffsPanelProps) {
  "use no memo";
  const { resolvedTheme } = useThemeMode();
  const { diffView, setDiffView, diffFile, setDiffFile } =
    useDiffSearchParams();
  const { isViewed, setViewed, viewedPaths } = useDiffViewedFiles(prUrl);
  const { state, refresh } = usePrDiff(prUrl, repoId);

  // Wrapping is a reading preference, so it persists across PRs and surfaces.
  const [wrapLines, setWrapLines] = useLocalStorage("eva:pr-diff-wrap", false);
  const [fileFilter, setFileFilter] = useState("");
  // Controlled accordion open set — independent of Viewed so a viewed file can
  // still be expanded to re-read without clearing the checkbox (GitHub UX).
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [seededFilesKey, setSeededFilesKey] = useState<string | null>(null);

  // Held in state, not a ref, because each file's body needs the element as its
  // IntersectionObserver root and has to re-observe once it exists.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  // Wrapper element for each file's diff, keyed by path, so a tree click can
  // scroll the matching diff into view.
  const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setFileRef = useCallback(
    (path: string) => (el: HTMLDivElement | null) => {
      const map = fileRefs.current;
      if (el) map.set(path, el);
      else map.delete(path);
    },
    [],
  );

  // One entry per changed file: patch, path, status, and change counts. Parsed
  // once when the diff is fetched, not on every render.
  const fileEntries = state.status === "ready" ? state.entries : [];
  const filePaths = fileEntries.map((entry) => entry.path);
  const totals = fileEntries.reduce(
    (sum, entry) => ({
      additions: sum.additions + entry.additions,
      deletions: sum.deletions + entry.deletions,
    }),
    { additions: 0, deletions: 0 },
  );
  const viewedCount = filePaths.filter((path) =>
    viewedPaths.includes(path),
  ).length;

  const query = fileFilter.trim().toLowerCase();
  const visibleEntries =
    query.length === 0
      ? fileEntries
      : fileEntries.filter((entry) => entry.path.toLowerCase().includes(query));
  const visiblePaths = visibleEntries.map((entry) => entry.path);
  const statuses = Object.fromEntries(
    visibleEntries.map((entry): [string, GitStatus] => [
      entry.path,
      entry.status,
    ]),
  );
  // Stable identity for the current file set: remounts the tree (whose model is
  // created once) whenever the listed files change.
  const filesKey = filePaths.join("\n");
  const visibleKey = visiblePaths.join("\n");

  // Re-seed open files when the changed set changes: open everything not yet
  // Viewed so returning reviewers land on collapsed progress.
  if (state.status === "ready" && filesKey !== seededFilesKey) {
    setSeededFilesKey(filesKey);
    setOpenPaths(filePaths.filter((path) => !viewedPaths.includes(path)));
  }

  const ensureOpen = (path: string) => {
    setOpenPaths((current) =>
      current.includes(path) ? current : [...current, path],
    );
  };

  // Selecting a file in the tree records it in the URL, expands its accordion,
  // and scrolls its header into view.
  const handleSelect = (path: string) => {
    setDiffFile(path);
    ensureOpen(path);
    // Defer scroll until after the accordion open state commits.
    requestAnimationFrame(() => {
      fileRefs.current
        .get(path)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  const handleViewedChange = (path: string, viewed: boolean) => {
    setViewed(path, viewed);
    // GitHub: checking Viewed collapses; unchecking expands.
    setOpenPaths((current) => {
      if (viewed) return current.filter((entry) => entry !== path);
      return current.includes(path) ? current : [...current, path];
    });
  };

  // On first load with a remembered file, expand + scroll to it once.
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    didInitialScrollRef.current = false;
  }, [filesKey]);
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (state.status !== "ready" || !diffFile) return;
    ensureOpen(diffFile);
    const el = fileRefs.current.get(diffFile);
    if (el) {
      el.scrollIntoView({ block: "start" });
      didInitialScrollRef.current = true;
    }
  }, [state.status, diffFile, filesKey]);

  if (!prUrl) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <EmptyState
          icon={<IconGitPullRequest />}
          title="No pull request yet"
          description="Once a pull request is opened for this work, its diff will appear here."
        />
      </div>
    );
  }

  const showTree = visibleEntries.length > 0;
  const prNumber = prNumberFromGithubUrl(prUrl);

  const fileDiffs = (
    <div ref={setScrollRoot} className="min-h-0 flex-1 overflow-auto">
      {state.status === "loading" ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : state.status === "error" ? (
        <div className="flex h-full items-center justify-center px-6">
          <EmptyState
            icon={<IconAlertTriangle />}
            title="Could not load the pull request diff."
          />
        </div>
      ) : fileEntries.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          No changes in this pull request yet.
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
          No files match “{fileFilter}”.
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {state.truncated ? (
            <p className="rounded-surface border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Diff is large and has been truncated.
            </p>
          ) : null}
          <Accordion
            type="multiple"
            value={openPaths}
            onValueChange={setOpenPaths}
            className="flex flex-col gap-3"
          >
            {visibleEntries.map((entry) => (
              <div key={entry.path} ref={setFileRef(entry.path)}>
                <DiffFileAccordionItem
                  entry={entry}
                  diffView={diffView}
                  resolvedTheme={resolvedTheme}
                  viewed={isViewed(entry.path)}
                  onViewedChange={(viewed) =>
                    handleViewedChange(entry.path, viewed)
                  }
                  wrapLines={wrapLines}
                  repoId={repoId}
                  baseSha={state.baseSha}
                  headSha={state.headSha}
                  repoUrl={state.repoUrl}
                  scrollRoot={scrollRoot}
                  // The scroll target must exist before it can be scrolled to.
                  eager={diffFile === entry.path}
                />
              </div>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DiffsToolbar
        fileCount={fileEntries.length}
        additions={totals.additions}
        deletions={totals.deletions}
        viewedCount={viewedCount}
        filter={fileFilter}
        onFilterChange={setFileFilter}
        diffView={diffView}
        onDiffViewChange={setDiffView}
        wrapLines={wrapLines}
        onWrapLinesChange={setWrapLines}
        allExpanded={
          visiblePaths.length > 0 &&
          visiblePaths.every((path) => openPaths.includes(path))
        }
        onExpandAll={() => setOpenPaths(filePaths)}
        onCollapseAll={() => setOpenPaths([])}
        isLoading={
          state.status === "loading" ||
          (state.status === "ready" && state.refreshing)
        }
        onRefresh={refresh}
        reviewAction={
          prNumber === undefined ? undefined : (
            <SubmitReviewPopover repoId={repoId} prNumber={prNumber} />
          )
        }
      />

      <div className="flex min-h-0 flex-1">
        {showTree ? (
          <ResizableSidebar
            storageKey="diff-file-tree"
            sidebar={
              <DiffFileTree
                key={visibleKey}
                files={visiblePaths}
                statuses={statuses}
                initialSelectedPath={diffFile || null}
                onSelect={handleSelect}
              />
            }
          >
            {fileDiffs}
          </ResizableSidebar>
        ) : (
          fileDiffs
        )}
      </div>
    </div>
  );
}
