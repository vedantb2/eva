"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Badge,
  Button,
  cn,
  EmptyState,
  LIST_ROW_CONTROL_CLASS,
  ListRow,
  StatusDot,
} from "@eva/ui";
import { IconEye, IconEyeOff, IconUsers } from "@tabler/icons-react";
import { UserInitials } from "@eva/shared";
import { useFollow } from "@/lib/contexts/FollowContext";
import { useQuantizedNow } from "@/lib/hooks/useQuantizedNow";
import { describeLocation } from "../_utils";

type Member = FunctionReturnType<typeof api.teamMembers.list>[number];

/** Same window the sidebar's online avatars use, so the two never disagree. */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

function getDisplayName(user: Member["user"]): string {
  if (!user) return "Unknown";
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.fullName ||
    user.email ||
    "Unknown"
  );
}

/**
 * Who on this team is online right now, what page they are on, and a button to
 * follow them. Follow goes through the same `FollowContext` as the sidebar's
 * online avatars, so `FollowOverlay` drives the navigation either way.
 */
export function TeamActivityTab({ members }: { members: Array<Member> }) {
  const currentUserId = useQuery(api.auth.me);
  const { following, startFollowing, stopFollowing } = useFollow();

  // Presence is decided here, not in the query: the server returns a raw
  // `lastSeenAt` and only a client can re-evaluate the window as time passes.
  const now = useQuantizedNow(30_000);
  const onlineMembers = members.filter(
    (member) =>
      !!member.user?.lastSeenAt &&
      now - member.user.lastSeenAt < ONLINE_WINDOW_MS,
  );

  if (onlineMembers.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers size={20} />}
        title="Nobody from this team is online right now."
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {onlineMembers.map((member) => {
        const name = getDisplayName(member.user);
        const location = describeLocation(member.user?.lastSeenPath);
        const isSelf = member.userId === currentUserId;
        const isFollowing = following?.userId === member.userId;
        const canFollow = !isSelf && !!member.user?.lastSeenPath;

        return (
          <ListRow key={member._id} density="compact">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <UserInitials userId={member.userId} hideLastSeen size="md" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-2sm font-medium">
                    <span data-pii className="truncate">
                      {name}
                    </span>
                    {isSelf ? (
                      <Badge variant="quiet" className="shrink-0">
                        You
                      </Badge>
                    ) : null}
                  </p>
                  <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <StatusDot tone="active" />
                    <span className="truncate">{location ?? "Online"}</span>
                  </p>
                </div>
              </div>
              {isFollowing ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn("shrink-0", LIST_ROW_CONTROL_CLASS)}
                  onClick={stopFollowing}
                >
                  <IconEyeOff size={14} className="mr-1.5" />
                  Stop following
                </Button>
              ) : canFollow ? (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("shrink-0", LIST_ROW_CONTROL_CLASS)}
                  onClick={() => startFollowing(member.userId, name)}
                >
                  <IconEye size={14} className="mr-1.5" />
                  Follow
                </Button>
              ) : null}
            </div>
          </ListRow>
        );
      })}
    </div>
  );
}
