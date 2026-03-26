import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import { useQuery } from "convex/react";
import { Facehash } from "facehash";
import dayjs from "../utils/dates";

export function UserInitials({
  userId,
  hideLastSeen,
  size,
}: {
  userId: Id<"users">;
  hideLastSeen?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const user = useQuery(api.users.get, { id: userId });
  if (!user) return null;
  const firstLast =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const initials =
    firstLast ||
    (user.fullName
      ? user.fullName
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?");
  const name =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.fullName ||
    "";
  const online = !!user.lastSeenAt && Date.now() - user.lastSeenAt < 120_000;
  const tooltip = online
    ? `${name} · Online`
    : user.lastSeenAt
      ? `${name} · Active ${dayjs(user.lastSeenAt).fromNow()}`
      : name;
  const iconSizePx = size === "md" ? 32 : size === "lg" ? 40 : 20;
  const dotSize =
    size === "lg" ? "h-3 w-3" : size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative bg-accent rounded-full overflow-visible"
          style={{ width: iconSizePx, height: iconSizePx }}
        >
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
