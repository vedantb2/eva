"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { SidebarCountBadge } from "@/lib/components/sidebar/_components/SidebarCountBadge";

interface DraftsCountBadgeProps {
  repoId: Id<"githubRepos">;
}

export function DraftsCountBadge({ repoId }: DraftsCountBadgeProps) {
  const commentDrafts = useQuery(api.drafts.listForRepo, { repoId });
  const taskDraftCount = useQuery(api.agentTasks.countDrafts, { repoId });

  const count = (commentDrafts?.length ?? 0) + (taskDraftCount ?? 0);

  if (count === 0) {
    return null;
  }

  return <SidebarCountBadge count={count} />;
}
