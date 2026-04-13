import { Badge } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

export function UnreadAutomationsBadge({
  repoId,
}: {
  repoId: Id<"githubRepos">;
}) {
  const count = useQuery(api.automations.countUnreadByRepo, { repoId });

  if (!count) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="ml-auto border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="text-[11px] font-medium text-muted-foreground">
        {count > 99 ? "99+" : count}
      </span>
    </Badge>
  );
}
