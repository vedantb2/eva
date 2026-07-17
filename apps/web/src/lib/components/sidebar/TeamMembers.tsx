"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import { IconUsers } from "@tabler/icons-react";
import { useFollow } from "@/lib/contexts/FollowContext";
import { RepoLogo } from "@/lib/components/RepoLogo";

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
                    isFollowing && "ring-2 ring-primary",
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
    <div className="ui-surface mb-2 p-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <RepoLogo
          logoUrl={teamData.logoUrl}
          size={18}
          fallback={
            <div className="flex size-[18px] shrink-0 items-center justify-center rounded border border-border bg-primary/10">
              <IconUsers size={11} className="text-primary" />
            </div>
          }
        />
        <span
          className="relative flex size-2 shrink-0 items-center justify-center"
          aria-hidden
        >
          <span className="size-1.5 rounded-full bg-success" />
          <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success/40" />
        </span>
        <span className="truncate text-xs font-medium text-sidebar-foreground">
          {teamData.teamName}
        </span>
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {onlineMembers.length} online
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
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
                    isFollowing && "ring-2 ring-primary",
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
