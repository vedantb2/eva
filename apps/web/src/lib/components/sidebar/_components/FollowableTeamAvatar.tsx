"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { UserInitials } from "@eva/shared";

type TeamMember = NonNullable<
  FunctionReturnType<typeof api.users.listTeamWithMembers>
>["members"][number];

interface FollowableTeamAvatarProps {
  user: TeamMember;
  /** Display name, used in the tooltip; carries `data-pii`. */
  name: string;
  isFollowing: boolean;
  /** Absent when the teammate has no route to follow into. */
  hasPath: boolean;
  onToggle: () => void;
}

/**
 * One online teammate in the sidebar presence strip: avatar in, follow out.
 *
 * The collapsed rail and the expanded panel render the identical control, so it
 * lives here rather than twice inside `TeamMembers`.
 */
export function FollowableTeamAvatar({
  user,
  name,
  isFollowing,
  hasPath,
  onToggle,
}: FollowableTeamAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "rounded-full p-0 transition-[transform,background-color] hover:scale-110 hover:bg-transparent",
            isFollowing && "ring-2 ring-primary",
          )}
          onClick={onToggle}
          disabled={!hasPath && !isFollowing}
        >
          <UserInitials user={user} size="sm" hideLastSeen />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isFollowing ? "Stop following " : hasPath ? "Follow " : ""}
        <span data-pii>{name}</span>
      </TooltipContent>
    </Tooltip>
  );
}
