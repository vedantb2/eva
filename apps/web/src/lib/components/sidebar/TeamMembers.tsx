"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import { useFollow } from "@/lib/contexts/FollowContext";

function getDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}): string {
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.fullName ||
    ""
  );
}

export function TeamMembers({ collapsed }: { collapsed: boolean }) {
  const teamData = useQuery(api.users.listTeamWithMembers, {});
  const { following, startFollowing, stopFollowing } = useFollow();

  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;

  const onlineMembers = teamData
    ? teamData.members.filter(
        (u) => !!u.lastSeenAt && now - u.lastSeenAt < twoMinutes,
      )
    : [];

  if (!teamData || onlineMembers.length === 0) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 pb-3">
        {onlineMembers.slice(0, 3).map((u) => {
          const name = getDisplayName(u);
          const isFollowing = following?.userId === u._id;

          return (
            <Tooltip key={u._id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-full transition-[transform,background-color] hover:scale-110",
                    isFollowing && "ring-2 ring-blue-500",
                  )}
                  onClick={() => {
                    if (isFollowing) {
                      stopFollowing();
                    } else if (u.lastSeenPath) {
                      startFollowing(u._id, name);
                    }
                  }}
                  disabled={!u.lastSeenPath && !isFollowing}
                >
                  <UserInitials user={u} size="sm" hideLastSeen />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isFollowing
                  ? `Stop following ${name}`
                  : u.lastSeenPath
                    ? `Follow ${name}`
                    : name}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {onlineMembers.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{onlineMembers.length - 3}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 pb-3">
      <span className="text-xs font-medium text-sidebar-foreground mb-1">
        {teamData.teamName} · {onlineMembers.length} online
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {onlineMembers.map((u) => {
          const name = getDisplayName(u);
          const isFollowing = following?.userId === u._id;
          return (
            <Tooltip key={u._id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-full transition-[transform,background-color] hover:scale-110",
                    isFollowing && "ring-2 ring-blue-500",
                  )}
                  onClick={() => {
                    if (isFollowing) {
                      stopFollowing();
                    } else if (u.lastSeenPath) {
                      startFollowing(u._id, name);
                    }
                  }}
                  disabled={!u.lastSeenPath && !isFollowing}
                >
                  <UserInitials user={u} size="sm" hideLastSeen />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isFollowing
                  ? `Stop following ${name}`
                  : u.lastSeenPath
                    ? `Follow ${name}`
                    : name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
