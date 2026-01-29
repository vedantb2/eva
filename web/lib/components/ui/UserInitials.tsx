import { api } from "@/api";
import { Badge, Tooltip } from "@heroui/react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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
      ? `${name} · Active ${formatRelativeTime(user.lastSeenAt)}`
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
        <div className="w-6 h-6 shrink-0 flex items-center justify-center bg-teal-500 text-white rounded-full text-xs font-medium">
          {initials}
        </div>
      </Badge>
    </Tooltip>
  );
}
