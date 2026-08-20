import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Card, CardContent, Skeleton } from "@eva/ui";
import { IconBrandGithub, IconTerminal2 } from "@tabler/icons-react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { repoSessionsIndexPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";

export const Route = createFileRoute("/_global/sessions")({
  staticData: { title: "Sessions" },
  component: SessionsCodebasePicker,
});

/**
 * Landing for the rail's Sessions entry: pick which codebase to open sessions
 * for. It used to forward straight to the first app's composer, which made the
 * rail tile a shortcut to one arbitrary app; the picker makes the choice
 * explicit and keeps the URL stable for its other callers (spotlight's
 * "Sessions" entry in `convex/spotlight.ts`, and the fallback both session
 * archive dialogs navigate to after archiving the session being viewed).
 *
 * Cards link to `<app>/sessions` via `repoSessionsIndexPath`, the same helper
 * the rail and hotkeys use, so there is one definition of an app's sessions URL.
 */
function SessionsCodebasePicker() {
  const repos = useQuery(api.githubRepos.list, {});

  return (
    <PageWrapper title="Select a codebase">
      {repos === undefined ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading codebases"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] border border-border" />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <EmptyState
          icon={<IconTerminal2 size={28} />}
          title="No codebases yet"
          description="Connect a repository to start a session."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Link
              key={repo._id}
              to={repoSessionsIndexPath(repo)}
              className="block rounded-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <Card className="motion-emphasized ui-surface-interactive cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <RepoLogo
                    logoUrl={repo.logoUrl}
                    size={28}
                    fallback={
                      <IconBrandGithub
                        size={28}
                        className="text-muted-foreground"
                      />
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {repoDisplayLabel(repo)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {repo.owner}/{repo.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
