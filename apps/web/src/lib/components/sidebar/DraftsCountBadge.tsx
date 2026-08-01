import { Badge } from "@eva/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";

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

  return (
    <Badge
      variant="secondary"
      className="ml-auto border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="text-2xs font-medium text-muted-foreground">
        {count > 99 ? "99+" : count}
      </span>
    </Badge>
  );
}
