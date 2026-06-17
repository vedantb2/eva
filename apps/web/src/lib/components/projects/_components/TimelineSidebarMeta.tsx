"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { AvatarStack } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";

type ProjectProgress = FunctionReturnType<
  typeof api.projects.listTaskProgress
>[number];

interface TimelineSidebarMetaProps {
  progress?: ProjectProgress;
  lead?: Id<"users">;
  members?: Id<"users">[];
  /** Shown when a project has neither a lead nor members. */
  fallbackUserId: Id<"users">;
}

const MAX_AVATARS = 2;

/** Trailing content for a timeline sidebar row: completion percent + the
 *  lead/member avatars. Presentational; progress is supplied by the parent. */
export function TimelineSidebarMeta({
  progress,
  lead,
  members,
  fallbackUserId,
}: TimelineSidebarMetaProps) {
  const ids = [
    ...new Set(
      [lead, ...(members ?? [])].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    ),
  ];
  const all = ids.length > 0 ? ids : [fallbackUserId];
  const shown = all.slice(0, MAX_AVATARS);
  const hidden = all.length - shown.length;

  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      {total > 0 && (
        <span className="w-7 text-right text-[10px] font-semibold tabular-nums text-muted-foreground">
          {pct}%
        </span>
      )}
      <AvatarStack size={18} className="-space-x-1">
        {shown.map((id) => (
          <UserInitials key={id} userId={id} hideLastSeen />
        ))}
      </AvatarStack>
      {hidden > 0 && (
        <span className="text-[10px] font-medium leading-none text-muted-foreground">
          +{hidden}
        </span>
      )}
    </div>
  );
}
