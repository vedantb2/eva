"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconBrandGithub, IconPlus, IconRefresh } from "@tabler/icons-react";
import { syncGitHubRepos } from "./actions";

const GITHUB_APP_NAME = "v-conductor-dev";

export function ReposClient() {
  const repos = useQuery(api.githubRepos.list);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncGitHubRepos();
    } catch (err) {
      console.error("Sync failed:", err);
    }
    setSyncing(false);
  };

  const connectUrl = "https://github.com/apps/" + GITHUB_APP_NAME + "/installations/new";
  const configureUrl = "https://github.com/settings/installations";

  const hasRepos = repos && repos.length > 0;

  return (
    <>
      <PageHeader
        title="Repositories"
        headerRight={
          <div className="flex items-center gap-1 sm:gap-2">
            {hasRepos && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <IconRefresh className={"w-4 h-4" + (syncing ? " animate-spin" : "")} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}
            <a
              href={hasRepos ? configureUrl : connectUrl}
              target={hasRepos ? "_blank" : undefined}
              rel={hasRepos ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{hasRepos ? "Add Repos" : "Connect GitHub"}</span>
            </a>
          </div>
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
            action={
              <a
                href={connectUrl}
                className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
              >
                <IconBrandGithub className="w-4 h-4" />
                Connect GitHub Repository
              </a>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <Link
                key={repo._id}
                href={"/" + encodeRepoSlug(repo.owner + "/" + repo.name) + "/plan"}
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
