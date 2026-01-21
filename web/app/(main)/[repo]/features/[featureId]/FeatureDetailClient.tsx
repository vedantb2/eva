"use client";

import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { FeatureKanbanBoard } from "@/lib/components/features/FeatureKanbanBoard";
import { IconGitBranch, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

interface FeatureDetailClientProps {
  featureId: string;
}

const statusColors = {
  planning:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
};

export function FeatureDetailClient({ featureId }: FeatureDetailClientProps) {
  const { fullName } = useRepo();
  const typedFeatureId = featureId as Id<"features">;
  const feature = useQuery(api.features.get, { id: typedFeatureId });

  if (feature === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (feature === null) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Feature not found
          </h2>
          <Link
            href={`/${encodeRepoSlug(fullName)}/features`}
            className="mt-4 inline-flex items-center gap-1 text-pink-600 hover:text-pink-700"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to features
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={feature.title}
      showBack
      fillHeight
      headerRight={
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-medium rounded-full ${statusColors[feature.status]}`}
          >
            {feature.status}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-sm text-neutral-500 max-w-[150px] truncate">
            <IconGitBranch className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{feature.branchName}</span>
          </span>
        </div>
      }
    >
      {feature.description && (
        <p className="mb-4 sm:mb-6 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          {feature.description}
        </p>
      )}
      <FeatureKanbanBoard featureId={typedFeatureId} />
    </PageWrapper>
  );
}
