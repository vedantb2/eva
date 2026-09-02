import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import {
  AveBusy,
  AveHomeRepoPicker,
} from "@/lib/components/ave/AveHomeRepoPicker";
import { encodeRepoParam } from "@/lib/utils/repoUrl";
import { CachedSessionShell } from "@/routes/_repo/$owner/$repo/sessions/_components/CachedSessionShell";

export const Route = createFileRoute("/_global/ave")({
  staticData: { title: "Manager Ave" },
  component: AveRoute,
});

/**
 * Manager Ave full screen: one persistent session per user, but it lives at
 * this stable URL rather than redirecting into `/$owner/$repo/sessions/$numId`
 * — the session shell is mounted inline instead. Its `chatOnly` branch drops
 * the sandbox panel, so all that renders here is the chat. The floating
 * launcher (`AveLauncherProvider`) mounts the same shell as a popover; this is
 * where its expand button lands.
 */
function AveRoute() {
  const orchestrator = useQuery(api.sessions.getOrchestratorSession, {});

  // `undefined` is "still loading", not "no session" — rendering the picker
  // here would flash a codebase list at every user who already has one.
  if (orchestrator === undefined) return <AveBusy label="Opening Manager Ave" />;

  if (orchestrator === null) return <AveHomeRepoPicker redirectHomeWhenEmpty />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The shell carries its own passive RepoProvider, so Ave's repo resolves
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

