"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { GitStatus } from "@pierre/trees";
import { Accordion, Spinner } from "@conductor/ui";
import { IconGitPullRequest, IconAlertTriangle } from "@tabler/icons-react";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { DiffFileTree } from "./DiffFileTree";
import { DiffFileAccordionItem } from "./DiffFileAccordionItem";
import { splitDiffFiles, fileNameFromPatch, diffFileStatus } from "./diffFiles";
import { useDiffSearchParams } from "./useDiffSearchParams";
import { useDiffViewedFiles } from "./useDiffViewedFiles";

interface DiffsPanelProps {
  /** PR URL for the current surface; absent when no PR exists yet. */
  prUrl?: string;
  repoId: Id<"githubRepos">;
  /** Lets PrPanel host Unified/Split + Refresh on the Diffs/Recap row. */
  onToolbarStateChange?: (state: {
    isLoading: boolean;
    refresh: () => void;
  }) => void;
}

type DiffState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; diff: string; truncated: boolean };

/**
 * Sandbox "Diffs" tab. Renders the pushed PR diff (from GitHub) with
 * `@pierre/diffs`, in unified or split view, alongside a clickable
 * `@pierre/trees` file tree on the left for jumping straight to a file's diff.
 * Each file sits in a collapsible accordion with a GitHub-style Viewed checkbox
 * (persisted per PR in localStorage). The diff comes from a non-reactive Convex
 * action, so it is loaded imperatively and re-pulled by Refresh (chrome lives on
 * PrPanel's Diffs/Recap row).
 */
export function DiffsPanel({
  prUrl,
  repoId,
  onToolbarStateChange,
}: DiffsPanelProps) {
  const getPrDiff = useAction(api.github.getPrDiff);
  const { resolvedTheme } = useThemeMode();
  const { diffView, diffFile, setDiffFile } = useDiffSearchParams();
  const { isViewed, setViewed, viewedPaths } = useDiffViewedFiles(prUrl);

  const [state, setState] = useState<DiffState>({ status: "loading" });
  // Bumped by Refresh to force the load effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);
  // Controlled accordion open set — independent of Viewed so a viewed file can
  // still be expanded to re-read without clearing the checkbox (GitHub UX).
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [seededFilesKey, setSeededFilesKey] = useState<string | null>(null);

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

  useEffect(() => {
    if (!prUrl) return;
    let cancelled = false;
    setState({ status: "loading" });
    getPrDiff({ repoId, prUrl })
      .then((res) => {
        if (cancelled) return;
        setState({
          status: "ready",
          diff: res.diff,
          truncated: res.truncated,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [prUrl, repoId, reloadKey, getPrDiff]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    onToolbarStateChange?.({
      isLoading: state.status === "loading",
      refresh,
    });
  }, [onToolbarStateChange, refresh, state.status]);

  // One entry per changed file: the self-contained patch and its (new) path.
  const fileEntries = (
    state.status === "ready" ? splitDiffFiles(state.diff) : []
  ).map((patch, index) => ({
    patch,
    path: fileNameFromPatch(patch, `file-${index}`),
  }));
  const filePaths = fileEntries.map((entry) => entry.path);
  const statuses = Object.fromEntries(
    fileEntries.map((entry): [string, GitStatus] => [
      entry.path,
      diffFileStatus(entry.patch),
    ]),
  );
  // Stable identity for the current file set: remounts the tree (whose model is
  // created once) whenever the changed files change.
  const filesKey = useMemo(() => filePaths.join("\n"), [filePaths]);

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
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <IconGitPullRequest className="h-10 w-10 text-muted-foreground/60" />
        <div className="max-w-md space-y-1">
          <p className="text-sm font-medium">No pull request yet</p>
          <p className="text-sm text-muted-foreground">
            Once a pull request is opened for this work, its diff will appear
            here.
          </p>
        </div>
      </div>
    );
  }

  const showTree = state.status === "ready" && fileEntries.length > 0;

  return (
    <div className="flex h-full min-h-0">
      {showTree ? (
        <div className="flex min-h-0 w-64 shrink-0 flex-col border-r border-border">
          <DiffFileTree
            key={filesKey}
            files={filePaths}
            statuses={statuses}
            initialSelectedPath={diffFile || null}
            onSelect={handleSelect}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {state.status === "loading" ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : state.status === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <IconAlertTriangle className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Could not load the pull request diff.
            </p>
          </div>
        ) : fileEntries.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No changes in this pull request yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {state.truncated ? (
              <p className="text-xs text-muted-foreground">
                Diff is large and has been truncated.
              </p>
            ) : null}
            <Accordion
              type="multiple"
              value={openPaths}
              onValueChange={setOpenPaths}
              className="flex flex-col gap-3"
            >
              {fileEntries.map(({ patch, path }) => (
                <div key={path} ref={setFileRef(path)}>
                  <DiffFileAccordionItem
                    path={path}
                    patch={patch}
                    diffView={diffView}
                    resolvedTheme={resolvedTheme}
                    viewed={isViewed(path)}
                    onViewedChange={(viewed) =>
                      handleViewedChange(path, viewed)
                    }
                  />
                </div>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}
