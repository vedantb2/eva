import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  // Avatar,
  // AvatarFallback,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
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
  const iconSizePx = size === "md" ? 32 : size === "lg" ? 40 : 20;

  // const avatar = (
  //   <Avatar className={iconSize}>
  //     <AvatarFallback className="bg-primary text-primary-foreground text-xs">
  //       {initials}
  //     </AvatarFallback>
  //   </Avatar>
  // );

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="relative">
          <Facehash size={iconSizePx} name={initials} enableBlink interactive />
          {!hideLastSeen && user.lastSeenAt && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-background ${
                online ? "bg-success" : "bg-warning"
              }`}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  // return (
  //   <Tooltip>
  //     <TooltipTrigger asChild>
  //       <div className="relative">
  //         {avatar}
  //         {!hideLastSeen && user.lastSeenAt && (
  //           <span
  //             className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-background ${
  //               online ? "bg-success" : "bg-warning"
  //             }`}
  //           />
  //         )}
  //       </div>
  //     </TooltipTrigger>
  //     <TooltipContent>{tooltip}</TooltipContent>
  //   </Tooltip>
  // );
}
