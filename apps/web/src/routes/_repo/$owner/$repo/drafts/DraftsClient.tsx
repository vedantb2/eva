"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { IconFileText } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { DraftCard } from "./_components/DraftCard";
import { mergeDrafts } from "./_utils";

export function DraftsClient() {
  const { repo, basePath } = useRepo();

  const commentDrafts = useQuery(api.drafts.listForRepo, { repoId: repo._id });
  const taskDrafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });

  if (commentDrafts === undefined || taskDrafts === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const drafts = mergeDrafts(commentDrafts, taskDrafts);

  return (
    <PageWrapper title="Drafts">
      {drafts.length === 0 ? (
        <EmptyState
          icon={<IconFileText size={24} className="text-muted-foreground" />}
          title="No drafts"
          description="Drafts save automatically as you type comments, prompts, or compose quick tasks."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {drafts.map((model) => (
            <DraftCard
              key={
                model.source === "comment"
                  ? `comment-${model.row._id}`
                  : `task-${model.row._id}`
              }
              model={model}
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
