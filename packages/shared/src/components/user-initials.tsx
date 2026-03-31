import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import { useQuery } from "convex/react";
import { Facehash } from "facehash";
import dayjs from "../utils/dates";

interface UserFields {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  lastSeenAt?: number | null;
}

export function getUserInitials(user: UserFields): string {
  const firstLast =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  if (firstLast) return firstLast;
  if (user.fullName) {
    return user.fullName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return "?";
}

function getUserName(user: UserFields): string {
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.fullName ||
    ""
  );
}

export function UserInitials({
  userId,
  user: preloadedUser,
  hideLastSeen,
  size,
}: {
  userId?: Id<"users">;
  user?: UserFields;
  hideLastSeen?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const fetchedUser = useQuery(
    api.users.get,
    !preloadedUser && userId ? { id: userId } : "skip",
  );
  const user = preloadedUser ?? fetchedUser;
  if (!user) return null;

  const initials = getUserInitials(user);
  const name = getUserName(user);
  const online = !!user.lastSeenAt && Date.now() - user.lastSeenAt < 120_000;
  const tooltip = online
    ? `${name} · Online`
    : user.lastSeenAt
      ? `${name} · Active ${dayjs(user.lastSeenAt).fromNow()}`
      : name;
  const iconSizePx = size === "md" ? 24 : size === "lg" ? 32 : 16;
  const dotSize =
    size === "lg" ? "h-3 w-3" : size === "md" ? "h-2.5 w-2.5" : "h-1.5 w-1.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative flex items-center justify-center rounded-full bg-accent">
          <Facehash size={iconSizePx} name={initials} enableBlink interactive />
          {!hideLastSeen && user.lastSeenAt && (
            <span
              className={`absolute bottom-0 left-0 ${dotSize} block rounded-full border-2 border-background ${
                online ? "bg-success" : "bg-warning"
              }`}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
