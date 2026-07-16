"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { PatchDiff } from "@pierre/diffs/react";
import { Button, Spinner, cn } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import { diffViewParser } from "@/lib/search-params";
import { useThemeMode } from "@/lib/hooks/useThemeMode";

interface DiffsPanelProps {
  /** PR URL for the current surface; absent when no PR exists yet. */
  prUrl?: string;
  repoId: Id<"githubRepos">;
}

type DiffState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; diff: string; truncated: boolean };

/** Splits a multi-file git diff into one self-contained patch string per file. */
function splitDiffFiles(diff: string): string[] {
  if (diff.trim().length === 0) return [];
  return diff
    .split(/\n(?=diff --git )/)
    .map((section) => section.trim())
    .filter((section) => section.startsWith("diff --git "));
}

/** Reads the (new) file path from a single-file git patch, for a stable key. */
function fileNameFromPatch(patch: string, fallback: string): string {
  const match = patch.match(/^diff --git a\/.+? b\/(.+)$/m);
  return match ? match[1] : fallback;
}

/**
 * Sandbox "Diffs" tab. Renders the pushed PR diff (from GitHub) with
 * `@pierre/diffs`, in unified or split view. The diff comes from a non-reactive
 * Convex action, so it is loaded imperatively and re-pulled by a Refresh button.
 */
export function DiffsPanel({ prUrl, repoId }: DiffsPanelProps) {
  const getPrDiff = useAction(api.github.getPrDiff);
  const { resolvedTheme } = useThemeMode();
  const [diffView, setDiffView] = useQueryState("diffView", diffViewParser);

  const [state, setState] = useState<DiffState>({ status: "loading" });
  // Bumped by Refresh to force the load effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);

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

  const files = useMemo(
    () => (state.status === "ready" ? splitDiffFiles(state.diff) : []),
    [state],
  );

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {(["unified", "split"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => void setDiffView(view)}
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
        ) : files.length === 0 ? (
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
            {files.map((patch, index) => (
              <PatchDiff
                key={fileNameFromPatch(patch, `file-${index}`)}
                patch={patch}
                disableWorkerPool
                options={{
                  diffStyle: diffView,
                  theme: { light: "github-light", dark: "github-dark" },
                  themeType: resolvedTheme,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
