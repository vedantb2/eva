import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { m } from "motion/react";
import { api } from "@eva/backend";
import { IconBrandGithub, IconPlugConnectedX } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  Skeleton,
  motionBase,
  motionStagger,
} from "@eva/ui";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { repoSessionsIndexPath } from "@/lib/components/sidebar/_utils/repoSessionPaths";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";

export const Route = createFileRoute("/_global/sessions")({
  staticData: { title: "Sessions" },
  component: SessionsGlobalPage,
});

/** Landing for the rail Sessions entry — pick the app to compose a session in. */
function SessionsGlobalPage() {
  const repos = useQuery(api.githubRepos.list, {});
  const orderedRepos = repos
    ? [...repos].sort((a, b) =>
        repoDisplayLabel(a).localeCompare(repoDisplayLabel(b)),
      )
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <h1 className="text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg md:text-xl">
        Select a codebase
      </h1>
      {orderedRepos === undefined ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading codebases"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 border border-border" />
          ))}
        </div>
      ) : orderedRepos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No codebases yet. Connect one from Home.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedRepos.map((repo, index) => (
            <CodebaseCard key={repo._id} repo={repo} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One app card — opens that app's new-session composer. */
function CodebaseCard({ repo, index }: { repo: RepoWithLogo; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...motionBase, delay: motionStagger(index) }}
    >
      <Link
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
                  className={
                    repo.connected === false
                      ? "text-destructive/60"
                      : "text-muted-foreground"
                  }
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
            {repo.connected === false && (
              <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive">
                <IconPlugConnectedX size={11} />
                <span className="text-[11px] font-medium">Disconnected</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </m.div>
  );
}
