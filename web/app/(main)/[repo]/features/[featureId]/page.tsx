"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { IconGitBranch, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

export default function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = use(params);
  const { fullName } = useRepo();
  const feature = useQuery(api.features.get, {
    id: featureId as Id<"features">,
  });
  const tasks = useQuery(
    api.agentTasks.listByFeature,
    feature ? { featureId: feature._id } : "skip"
  );

  if (feature === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (feature === null) {
    return (
      <Container>
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
      </Container>
    );
  }

  const statusColors = {
    planning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
  };

  return (
    <>
      <PageHeader
        title={feature.title}
        headerLeft={
          <Link
            href={`/${encodeRepoSlug(fullName)}/features`}
            className="mr-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <IconArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
        }
        headerRight={
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 text-sm font-medium rounded-full ${statusColors[feature.status]}`}
            >
              {feature.status}
            </span>
            <span className="flex items-center gap-1 text-sm text-neutral-500">
              <IconGitBranch className="w-4 h-4" />
              {feature.branchName}
            </span>
          </div>
        }
      />
      <Container>
        {feature.description && (
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            {feature.description}
          </p>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Tasks
          </h3>
          {tasks === undefined ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
              No tasks yet. Tasks will be generated when the plan is finalized.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks
                .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0))
                .map((task) => (
                  <div
                    key={task._id}
                    className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {task.taskNumber && (
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 text-sm flex items-center justify-center font-medium">
                            {task.taskNumber}
                          </span>
                        )}
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-white">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
