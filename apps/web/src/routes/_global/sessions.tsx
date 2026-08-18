import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { firstRepoSessionsPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";

export const Route = createFileRoute("/_global/sessions")({
  staticData: { title: "Sessions" },
  component: SessionsGlobalRedirect,
});

/**
 * The rail's Sessions entry used to land on a "Select a codebase" grid. Every
 * other way into sessions already picks an app for you (tile click, ⌘1, a
 * session link), so the grid was a click between the user and the composer;
 * it now forwards straight to the first app's composer.
 *
 * Still a route rather than a deletion, because this URL has three callers
 * that would otherwise 404: the spotlight "Sessions" entry
 * (`convex/spotlight.ts` `GLOBAL_PAGES`), and the fallback both session
 * archive dialogs navigate to when you archive the session you are viewing.
 * Keeping one redirect here is cheaper than teaching each of them to resolve
 * a repo, and keeps `/sessions` bookmarks working.
 *
 * `replace` so the redirect does not sit in history — Back from the composer
 * would otherwise bounce through here and forward again.
 */
function SessionsGlobalRedirect() {
  const repos = useQuery(api.githubRepos.list, {});

  // `undefined` is "still loading", not "no apps" — bouncing to /home here
  // would flash the onboarding page at every user with apps.
  if (repos === undefined) {
    return (
      <div
        className="flex min-h-0 flex-1"
        aria-busy="true"
        aria-label="Opening sessions"
      />
    );
  }

  return <Navigate to={firstRepoSessionsPath(repos) ?? "/home"} replace />;
}
