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
import { encodeRepoParam } from "@/lib/utils/repoUrl";
import { repoTileColor } from "@/lib/utils/repoTileColor";
import { CachedSessionShell } from "@/routes/_repo/$owner/$repo/sessions/_components/CachedSessionShell";

export const Route = createFileRoute("/_global/orchestrator")({
  staticData: { title: "Orchestrator" },
  component: OrchestratorRoute,
});

/** Placeholder that holds the page while a query resolves. */
function OrchestratorBusy({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1" aria-busy="true" aria-label={label} />
  );
}

/**
 * The rail's Orchestrator entry: one persistent session per user, but it lives at
 * this stable URL rather than redirecting into `/$owner/$repo/sessions/$numId`
 * — the session shell is mounted inline instead. Its `chatOnly` branch drops
 * the sandbox panel, so all that renders here is the chat.
 */
function OrchestratorRoute() {
  const orchestrator = useQuery(api.sessions.getOrchestratorSession, {});

  // `undefined` is "still loading", not "no session" — rendering the picker
  // here would flash a codebase list at every user who already has one.
  if (orchestrator === undefined) return <OrchestratorBusy label="Opening orchestrator" />;

  if (orchestrator === null) return <OrchestratorHomeRepoPicker />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The shell carries its own passive RepoProvider, so the orchestrator's repo resolves
          without this route living under `/$owner/$repo`. */}
      <CachedSessionShell
        numId={String(orchestrator.numId)}
        owner={orchestrator.owner}
        repoParam={encodeRepoParam(orchestrator.name, orchestrator.rootDirectory)}
        isActiveRoute
      />
    </div>
  );
}

/** First-run only: the orchestrator needs a codebase to live in. */
function OrchestratorHomeRepoPicker() {
  const repos = useQuery(api.githubRepos.list, {});
  const ensureOrchestrator = useMutation(api.sessions.ensureOrchestratorSession);
  const [pendingRepoId, setPendingRepoId] = useState<Id<"githubRepos"> | null>(
    null,
  );

  // No navigate here — `getOrchestratorSession` is live, so the parent route
  // picks up the new session and renders the chat on its own.
  const startOrchestrator = (repoId: Id<"githubRepos">) => {
    setPendingRepoId(repoId);
    void catchMutationError(
      ensureOrchestrator({ repoId }),
      "Couldn't start the orchestrator",
      "orchestrator-session-create",
    ).catch(() => setPendingRepoId(null));
  };

  if (repos === undefined) return <OrchestratorBusy label="Loading codebases" />;
  if (repos.length === 0) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Choose a home codebase</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The orchestrator is your persistent agent that runs and supervises
          your other agents. Pick where it lives — you can talk to it about any codebase
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
