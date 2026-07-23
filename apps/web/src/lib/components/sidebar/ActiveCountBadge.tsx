"use client";

import { Badge } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

interface ActiveCountBadgeProps {
  repoId: Id<"githubRepos">;
}

export function ActiveCountBadge({ repoId }: ActiveCountBadgeProps) {
  const designCount = useQuery(api.designSessions.countActive, { repoId });

  if (!designCount) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="ml-auto gap-1.5 border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="h-2 w-2 rounded-full bg-success" />
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
        {designCount}
      </span>
    </Badge>
  );
}
