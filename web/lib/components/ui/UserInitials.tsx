import { api } from "@/api";
import dayjs from "@/lib/dates";
import { Avatar } from "@heroui/avatar";
import { Badge, Tooltip } from "@heroui/react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";

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
    <Avatar
      name={initials || "?"}
      classNames={{
        base: `${iconSize} bg-teal-500`,
        name: "text-teal-100",
      }}
    />
  );
  if (hideLastSeen) {
    return <Tooltip content={tooltip}>{avatar}</Tooltip>;
  }
  return (
    <Tooltip content={tooltip}>
      <Badge
        content=""
        size="sm"
        color={online ? "success" : "warning"}
        shape="circle"
        placement="bottom-right"
        isInvisible={hideLastSeen || !user.lastSeenAt}
      >
        {avatar}
      </Badge>
    </Tooltip>
  );
}
