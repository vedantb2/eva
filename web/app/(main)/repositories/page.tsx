"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react";

export default function RepositoriesPage() {
  const repos = useQuery(api.githubRepos.list);

  return (
    <>
      <PageHeader title="Repositories" />
      <Container>
        {repos === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : repos.length === 0 ? (
          <EmptyState
            icon={IconBrandGithub}
            title="No repositories connected"
            description="Connect a GitHub repository to start creating feature boards"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <Link
                key={repo._id}
                href={`/repositories/${repo.owner}/${repo.name}`}
                className="group block p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <IconBrandGithub className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {repo.owner}
                      </p>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                  </div>
                  <IconExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-pink-600 transition-colors" />
                </div>
                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  View Kanban board for this repository
                </p>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
