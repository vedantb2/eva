"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Skeleton } from "@eva/ui";
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
      <PageWrapper title="Drafts" comfortable>
        <div
          className="grid min-h-[20rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading drafts"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 border border-border" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  const drafts = mergeDrafts(commentDrafts, taskDrafts);

  return (
    <PageWrapper title="Drafts" comfortable fillHeight={drafts.length === 0}>
      {drafts.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState
            icon={<IconFileText className="size-6 text-muted-foreground" />}
            title="No drafts"
            description="Drafts save automatically as you type comments, prompts, or compose quick tasks."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
