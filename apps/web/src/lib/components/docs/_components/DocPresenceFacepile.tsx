"use client";

import usePresence from "@convex-dev/presence/react";
import { api } from "@eva/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import type { Id } from "@eva/backend";
import { cn } from "@eva/ui";

export function DocPresenceFacepile({ docId }: { docId: Id<"docs"> }) {
  const currentUserId = useQuery(api.auth.me);
  const presenceStates = usePresence(
    api.presence,
    `doc:${docId}`,
    currentUserId ?? "",
  );

  if (!currentUserId) return null;

  const others = (presenceStates ?? []).filter(
    (p) => p.userId !== currentUserId && p.online,
  );

  if (others.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      {others.slice(0, 5).map((p) => (
        <UserAvatar key={p.userId} name={p.name} />
      ))}
      {others.length > 5 && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          +{others.length - 5}
        </span>
      )}
    </div>
  );
}

function UserAvatar({ name }: { name?: string }) {
  const displayName = name ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      title={displayName}
      className={cn(
        "flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground",
      )}
    >
      {initial}
    </div>
  );
}
