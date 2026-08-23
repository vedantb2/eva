"use client";

import { useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Spinner, cn } from "@eva/ui";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { catchMutationError } from "@/lib/utils/mutationToast";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { repoTileColor } from "@/lib/utils/repoTileColor";

/** Placeholder that holds the surface while a query resolves. */
export function AveBusy({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1" aria-busy="true" aria-label={label} />
  );
}

interface AveHomeRepoPickerProps {
  /**
   * `/ave` is a whole page with nothing else to show, so it bounces to `/home`
   * when there is no codebase to pick. The launcher popover is an overlay on
   * some other page — it shows the empty state in place instead of yanking the
   * user off whatever they were doing.
   */
  redirectHomeWhenEmpty?: boolean;
}

/**
 * First-run only: Manager Ave needs a codebase to live in. Shared by the `/ave`
 * route and the floating launcher popover, which mount the same session surface
 * and so hit the same first-run gap.
 */
export function AveHomeRepoPicker({
  redirectHomeWhenEmpty = false,
}: AveHomeRepoPickerProps) {
  const repos = useQuery(api.githubRepos.list, {});
  const ensureOrchestrator = useMutation(api.sessions.ensureOrchestratorSession);
  const [pendingRepoId, setPendingRepoId] = useState<Id<"githubRepos"> | null>(
    null,
  );

  // No navigate here — `getOrchestratorSession` is live, so the parent surface
  // picks up the new session and renders the chat on its own.
  const startOrchestrator = (repoId: Id<"githubRepos">) => {
    setPendingRepoId(repoId);
    void catchMutationError(
      ensureOrchestrator({ repoId }),
      "Couldn't start Manager Ave",
      "ave-session-create",
    ).catch(() => setPendingRepoId(null));
  };

  if (repos === undefined) return <AveBusy label="Loading codebases" />;
  if (repos.length === 0) {
    if (redirectHomeWhenEmpty) return <Navigate to="/home" replace />;
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Manager Ave needs a codebase to live in.
        </p>
        <Link to="/home" className="text-sm font-medium underline-offset-4 hover:underline">
          Connect one
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Choose a home codebase</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Manager Ave is your persistent agent that runs and supervises your
          other agents. Pick where it lives — you can talk to it about any codebase
          from there.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-1">
        {repos.map((repo) => {
          const label = repoDisplayLabel(repo);
          return (
            <button
              key={repo._id}
              type="button"
              onClick={() => startOrchestrator(repo._id)}
              disabled={pendingRepoId !== null}
              className="motion-press flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-left text-sm active:scale-[0.99] hover:bg-accent disabled:opacity-60"
            >
              <RepoLogo
                logoUrl={repo.logoUrl}
                size={24}
                fallback={
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white",
                      repoTileColor(`${repo.owner}/${repo.name}/${label}`),
                    )}
                  >
                    {label.charAt(0).toUpperCase()}
                  </span>
                }
              />
              <span className="flex-1 truncate">{label}</span>
              <span className="truncate text-xs text-muted-foreground">
                {repo.owner}/{repo.name}
              </span>
              {pendingRepoId === repo._id ? <Spinner size="sm" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
