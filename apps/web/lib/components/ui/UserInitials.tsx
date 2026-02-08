import { api } from "@conductor/backend";
import dayjs from "@/lib/dates";
import {
  Avatar,
  AvatarFallback,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { useQuery } from "convex/react";
import type { Id } from "@conductor/backend";

export function UserInitials({
  userId,
  hideLastSeen,
  size,
}: {
  userId: string;
  hideLastSeen?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const user = useQuery(api.users.get, { id: userId as Id<"users"> });
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const online = !!user.lastSeenAt && Date.now() - user.lastSeenAt < 120_000;
  const tooltip = online
    ? `${name} · Online`
    : user.lastSeenAt
      ? `${name} · Active ${dayjs(user.lastSeenAt).fromNow()}`
      : name;
  const iconSize =
    size === "md" ? "size-8" : size === "lg" ? "size-10" : "size-5";

  const avatar = (
    <Avatar className={iconSize}>
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (hideLastSeen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{avatar}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          {avatar}
          {!hideLastSeen && user.lastSeenAt && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-background ${
                online ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
