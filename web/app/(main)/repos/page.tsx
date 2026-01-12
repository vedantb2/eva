"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";

const GITHUB_APP_NAME = "v-conductor-dev";

export default function RepositoriesPage() {
  const repos = useQuery(api.githubRepos.list);

  return (
    <>
      <PageHeader
        title="Repositories"
        headerRight={
          <a
            href={"https://github.com/apps/" + GITHUB_APP_NAME + "/installations/new"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Connect GitHub
          </a>
        }
      />
      <Container>
        {repos === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : repos.length === 0 ? (
          <EmptyState
            icon={IconBrandGithub}
            title="No repositories"
            description="Connect a GitHub repository to get started with planning and tracking features."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <Link
                key={repo._id}
                href={`/${encodeRepoSlug(`${repo.owner}/${repo.name}`)}/plan`}
                className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 transition-colors">
                    <IconBrandGithub className="w-5 h-5 text-neutral-600 dark:text-neutral-300 group-hover:text-pink-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {repo.owner}
                    </p>
                    <h3 className="text-base font-medium text-neutral-900 dark:text-white truncate">
                      {repo.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
