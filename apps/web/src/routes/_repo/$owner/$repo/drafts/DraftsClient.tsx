"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import {
  EmptyState,
  PageHeader,
  PageHeaderTitle,
  Skeleton,
} from "@eva/ui";
import { IconFileText } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRoutePageTitle } from "@/lib/contexts/PageTitleContext";
import { DraftCard } from "./_components/DraftCard";
import { mergeDrafts } from "./_utils";

export function DraftsClient() {
  const { repo, basePath } = useRepo();

  const commentDrafts = useQuery(api.drafts.listForRepo, { repoId: repo._id });
  const taskDrafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });

  // The page header lives in this pane, but the mobile top bar renders the
  // route title from context — so it still has to be published from here.
  useRoutePageTitle("Drafts");

  const drafts =
    commentDrafts === undefined || taskDrafts === undefined
      ? undefined
      : mergeDrafts(commentDrafts, taskDrafts);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader>
        <PageHeaderTitle>Drafts</PageHeaderTitle>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar">
        <div className="mx-auto w-full max-w-4xl px-2 py-2 sm:px-3">
          {drafts === undefined ? (
            <div
              className="space-y-1"
              aria-busy="true"
              aria-label="Loading drafts"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-surface" />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <EmptyState
              icon={<IconFileText size={24} className="text-muted-foreground" />}
              title="No drafts"
              description="Drafts save automatically as you type comments, prompts, or compose quick tasks."
            />
          ) : (
            <div className="space-y-1">
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
        </div>
      </div>
    </div>
  );
}
