"use client";

import { Badge } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

interface ActiveCountBadgeProps {
  repoId: Id<"githubRepos">;
  type: "sessions" | "designs";
}

export function ActiveCountBadge({ repoId, type }: ActiveCountBadgeProps) {
  const sessionCount = useQuery(
    api.sessions.countActive,
    type === "sessions" ? { repoId } : "skip",
  );
  const designCount = useQuery(
    api.designSessions.countActive,
    type === "designs" ? { repoId } : "skip",
  );

  const count = type === "sessions" ? sessionCount : designCount;

  if (!count) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="ml-auto gap-1.5 border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">
        {count}
      </span>
    </Badge>
  );
}
