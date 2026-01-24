"use client";

import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { TaskListPanel } from "@/lib/components/features/TaskListPanel";
import {
  IconGitBranch,
  IconArrowLeft,
  IconInfoCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Badge, Tooltip } from "@heroui/react";

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
          <Tooltip content={feature.description}>
            <IconInfoCircle size={18} />
          </Tooltip>
          <Badge>{feature.status}</Badge>
          <span className="hidden sm:flex items-center gap-1 text-sm text-neutral-500 max-w-[150px] truncate">
            <IconGitBranch className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{feature.branchName}</span>
          </span>
        </div>
      }
    >
      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden dark:border-neutral-700 -m-5">
        <div className="w-1/4 border-r dark:border-neutral-700 overflow-auto">
          <TaskListPanel featureId={typedFeatureId} />
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <p className="text-neutral-400">Sandbox (coming soon)</p>
        </div>
        <div className="w-1/4 border-r dark:border-neutral-700 flex items-center justify-center">
          <p className="text-neutral-400">Chat (coming soon)</p>
        </div>
      </div>
    </PageWrapper>
  );
}
