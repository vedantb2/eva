"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { IconLayoutKanban, IconChevronRight, IconGitBranch } from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

const statusColors = {
  planning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
};

export function FeaturesClient() {
  const { repo, fullName } = useRepo();
  const features = useQuery(api.features.list, { repoId: repo._id });

  return (
    <>
      <PageHeader title="Features" />
      <Container>
        {features === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : features.length === 0 ? (
          <EmptyState
            icon={IconLayoutKanban}
            title="No features yet"
            description="Features are created from finalized plans. Create a plan first to get started."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((feature) => (
              <Link
                key={feature._id}
                href={"/" + encodeRepoSlug(fullName) + "/features/" + feature._id}
                className="block p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                    <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={"px-2 py-0.5 text-xs font-medium rounded-full " + statusColors[feature.status]}
                      >
                        {feature.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500 truncate max-w-[150px] sm:max-w-none">
                        <IconGitBranch className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{feature.branchName}</span>
                      </span>
                    </div>
                  </div>
                  <IconChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-pink-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
