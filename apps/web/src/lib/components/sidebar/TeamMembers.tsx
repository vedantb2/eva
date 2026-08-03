"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { StatusDot } from "@eva/ui";
import { FollowableTeamAvatar } from "@/lib/components/sidebar/_components/FollowableTeamAvatar";
import { useFollow } from "@/lib/contexts/FollowContext";
import { useQuantizedNow } from "@/lib/hooks/useQuantizedNow";

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

/** Online teammates as followable avatars (above the sidebar stats). */
export function OnlineTeamAvatars({ collapsed }: { collapsed: boolean }) {
  const teamData = useQuery(api.users.listTeamWithMembers, {});
  const { following, startFollowing, stopFollowing } = useFollow();

  // Presence is decided here rather than in the query: `listTeamWithMembers`
  // returns every teammate with their `lastSeenAt`, and only a client can
  // re-evaluate "seen in the last two minutes" as time passes.
  const now = useQuantizedNow(30_000);
  const twoMinutes = 2 * 60 * 1000;

  const onlineMembers = teamData
    ? teamData.members.filter(
        (u) => !!u.lastSeenAt && now - u.lastSeenAt < twoMinutes,
      )
    : [];

  if (!teamData || onlineMembers.length === 0) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {onlineMembers.slice(0, 3).map((u) => {
          const name = getDisplayName(u);
          const isFollowing = following?.userId === u._id;

          return (
            <FollowableTeamAvatar
              key={u._id}
              user={u}
              name={name}
              isFollowing={isFollowing}
              hasPath={!!u.lastSeenPath}
              onToggle={() => {
                if (isFollowing) {
                  stopFollowing();
                } else if (u.lastSeenPath) {
                  startFollowing(u._id, name);
                }
              }}
            />
          );
        })}
        {onlineMembers.length > 3 && (
          <span className="text-3xs text-muted-foreground">
            +{onlineMembers.length - 3}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 px-0.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <StatusDot tone="active" />
        <span className="truncate text-3xs text-muted-foreground">
          {onlineMembers.length} online
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {onlineMembers.map((u) => {
          const name = getDisplayName(u);
          const isFollowing = following?.userId === u._id;
          return (
            <FollowableTeamAvatar
              key={u._id}
              user={u}
              name={name}
              isFollowing={isFollowing}
              hasPath={!!u.lastSeenPath}
              onToggle={() => {
                if (isFollowing) {
                  stopFollowing();
                } else if (u.lastSeenPath) {
                  startFollowing(u._id, name);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
