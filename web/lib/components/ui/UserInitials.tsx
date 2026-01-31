import { api } from "@/api";
import dayjs from "@/lib/dates";
import { Badge, Tooltip } from "@heroui/react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";

export function UserInitials({ userId }: { userId: Id<"users"> }) {
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
  return (
    <Tooltip content={tooltip}>
      <Badge
        content=""
        size="sm"
        color={online ? "success" : "warning"}
        shape="circle"
        placement="bottom-right"
        isInvisible={!user.lastSeenAt}
      >
        <div className="size-5 shrink-0 flex items-center justify-center bg-teal-500 text-teal-100 rounded-full text-xs font-medium">
          {initials}
        </div>
      </Badge>
    </Tooltip>
  );
}
