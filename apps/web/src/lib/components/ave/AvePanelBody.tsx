"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { AveBusy, AveHomeRepoPicker } from "@/lib/components/ave/AveHomeRepoPicker";
import { encodeRepoParam } from "@/lib/utils/repoUrl";
import { CachedSessionShell } from "@/routes/_repo/$owner/$repo/sessions/_components/CachedSessionShell";

/** The chat itself, once we know whether Ave has a home codebase yet. */
export function AvePanelBody() {
  const orchestrator = useQuery(api.sessions.getOrchestratorSession, {});

  // `undefined` is "still loading", not "no session" — rendering the picker
  // here would flash a codebase list at every user who already has one.
  if (orchestrator === undefined) return <AveBusy label="Opening Manager Ave" />;

  if (orchestrator === null) return <AveHomeRepoPicker />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* `isActiveRoute` is false because the popover is never the URL: it is
          what stops this shell's `SimpleViewSandboxRedirect` and legacy-id gate
          from navigating the page out from under whatever route is showing. The
          orchestrator session renders `chatOnly`, which has no sandbox panel and
          so needs nothing the flag turns on. */}
      <CachedSessionShell
        numId={String(orchestrator.numId)}
        owner={orchestrator.owner}
        repoParam={encodeRepoParam(orchestrator.name, orchestrator.rootDirectory)}
        isActiveRoute={false}
        embedded
      />
    </div>
  );
}
