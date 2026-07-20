"use client";

import { api } from "@conductor/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { IconBrandGithub } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { RepoLogo } from "@/lib/components/RepoLogo";

/** Minimal repo root: branding only (stats live in the sidebar footer). */
export function RepoHomeClient() {
  const { repo } = useRepo();
  const logoUrl = useQuery(api.githubRepos.getLogoUrl, { repoId: repo._id });

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <RepoLogo
          logoUrl={logoUrl}
          size={40}
          fallback={
            <IconBrandGithub
              size={40}
              className="shrink-0 text-muted-foreground"
            />
          }
        />
        <h1 className="truncate text-2xl tracking-tight font-semibold text-primary sm:text-3xl">
          {repoDisplayLabel(repo)}
        </h1>
      </div>
    </div>
  );
}
