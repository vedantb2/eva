"use client";

import { Badge } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

interface BuildingProjectsBadgeProps {
  repoId: Id<"githubRepos">;
}

export function BuildingProjectsBadge({ repoId }: BuildingProjectsBadgeProps) {
  const count = useQuery(api.projects.countBuilding, { repoId });

  if (!count) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="ml-auto gap-1.5 border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: "rgb(var(--status-progress-bar))" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: "rgb(var(--status-progress-bar))" }}
        />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
        {count} live
      </span>
    </Badge>
  );
}
