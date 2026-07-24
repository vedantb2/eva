"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
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
          className="flex min-h-[20rem] flex-col gap-2"
          aria-busy="true"
          aria-label="Loading drafts"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-surface border border-border bg-muted/60"
            />
          ))}
        </div>
      </PageWrapper>
    );
  }

  const drafts = mergeDrafts(commentDrafts, taskDrafts);

  return (
    <PageWrapper title="Drafts" comfortable>
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
