"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { GitStatus } from "@pierre/trees";
import { Button, Spinner, cn } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { DiffFileTree } from "./DiffFileTree";
import { ReviewableFileDiff } from "./ReviewableFileDiff";
import { splitDiffFiles, fileNameFromPatch, diffFileStatus } from "./diffFiles";
import { useDiffSearchParams } from "./useDiffSearchParams";

interface DiffsPanelProps {
  /** PR URL for the current surface; absent when no PR exists yet. */
  prUrl?: string;
  repoId: Id<"githubRepos">;
}

type DiffState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; diff: string; truncated: boolean };

/**
 * Sandbox "Diffs" tab. Renders the pushed PR diff (from GitHub) with
 * `@pierre/diffs`, in unified or split view, alongside a clickable
 * `@pierre/trees` file tree on the left for jumping straight to a file's diff.
 * The diff comes from a non-reactive Convex action, so it is loaded imperatively
 * and re-pulled by a Refresh button.
 */
export function DiffsPanel({ prUrl, repoId }: DiffsPanelProps) {
  const getPrDiff = useAction(api.github.getPrDiff);
  const { resolvedTheme } = useThemeMode();
  const { diffView, setDiffView, diffFile, setDiffFile } =
    useDiffSearchParams();

  const [state, setState] = useState<DiffState>({ status: "loading" });
  // Bumped by Refresh to force the load effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);

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

  // One entry per changed file: the self-contained patch and its (new) path.
  const fileEntries = useMemo(
    () =>
      (state.status === "ready" ? splitDiffFiles(state.diff) : []).map(
        (patch, index) => ({
          patch,
          path: fileNameFromPatch(patch, `file-${index}`),
        }),
      ),
    [state],
  );
  const filePaths = useMemo(
    () => fileEntries.map((entry) => entry.path),
    [fileEntries],
  );
  const statuses = useMemo(
    () =>
      Object.fromEntries(
        fileEntries.map((entry): [string, GitStatus] => [
          entry.path,
          diffFileStatus(entry.patch),
        ]),
      ),
    [fileEntries],
  );
  // Stable identity for the current file set: remounts the tree (whose model is
  // created once) whenever the changed files change.
  const filesKey = useMemo(() => filePaths.join("\n"), [filePaths]);

  // Selecting a file in the tree records it in the URL and scrolls its diff up.
  const handleSelect = useCallback(
    (path: string) => {
      setDiffFile(path);
      fileRefs.current
        .get(path)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [setDiffFile],
  );

  // On first load with a remembered file, scroll to it once (no smooth jump).
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    didInitialScrollRef.current = false;
  }, [filesKey]);
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (state.status !== "ready" || !diffFile) return;
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {(["unified", "split"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => {
                setDiffView(view);
              }}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors",
                diffView === view
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {view}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={state.status === "loading"}
        >
          <IconRefresh
            className={cn(
              "h-3.5 w-3.5",
              state.status === "loading" && "animate-spin",
            )}
          />
          Refresh
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
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
              {fileEntries.map(({ patch, path }) => (
                <div key={path} ref={setFileRef(path)}>
                  <ReviewableFileDiff
                    patch={patch}
                    path={path}
                    diffView={diffView}
                    resolvedTheme={resolvedTheme}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
