import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Spinner, cn } from "@eva/ui";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { catchMutationError } from "@/lib/utils/mutationToast";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { repoHref } from "@/lib/utils/repoUrl";
import { repoTileColor } from "@/lib/utils/repoTileColor";

export const Route = createFileRoute("/_global/master")({
  staticData: { title: "Master" },
  component: MasterRoute,
});

/** Placeholder that holds the page while a query resolves. */
function MasterBusy({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1" aria-busy="true" aria-label={label} />
  );
}

/**
 * The rail's Master entry. The master is one persistent session per user, shown
 * in the normal session UI — so this route only resolves (or creates) it and
 * forwards to its session URL. `replace` keeps it out of history, otherwise
 * Back from the master would bounce through here and forward again.
 */
function MasterRoute() {
  const master = useQuery(api.sessions.getOrchestratorSession, {});

  // `undefined` is "still loading", not "no master" — rendering the picker here
  // would flash a codebase list at every user who already has one.
  if (master === undefined) return <MasterBusy label="Opening master" />;

  if (master) {
    const base = repoHref(master.owner, master.name, master.rootDirectory);
    // Widened to string: `to` accepts plain strings (the sessions.tsx redirect
    // relies on the same escape hatch) but rejects template-literal types.
    const to: string = `${base}/sessions/${master.numId}`;
    return <Navigate to={to} replace />;
  }

  return <MasterHomeRepoPicker />;
}

/** First-run only: the master needs a codebase to live in. */
function MasterHomeRepoPicker() {
  const repos = useQuery(api.githubRepos.list, {});
  const ensureMaster = useMutation(api.sessions.ensureOrchestratorSession);
  const [pendingRepoId, setPendingRepoId] = useState<Id<"githubRepos"> | null>(
    null,
  );

  // No navigate here — `getOrchestratorSession` is live, so the parent route
  // picks up the new master and redirects on its own.
  const startMaster = (repoId: Id<"githubRepos">) => {
    setPendingRepoId(repoId);
    void catchMutationError(
      ensureMaster({ repoId }),
      "Couldn't create the master session",
      "master-session-create",
    ).catch(() => setPendingRepoId(null));
  };

  if (repos === undefined) return <MasterBusy label="Loading codebases" />;
  if (repos.length === 0) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Choose a home codebase</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Master is one session that runs your other agents. Pick where it lives
          — you can talk to it about any codebase from there.
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-1">
        {repos.map((repo) => {
          const label = repoDisplayLabel(repo);
          return (
            <button
              key={repo._id}
              type="button"
              onClick={() => startMaster(repo._id)}
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
