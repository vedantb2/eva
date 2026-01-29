import { api } from "@/api";
import { Tooltip } from "@heroui/react";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";

interface UserInitialsProps {
  userId: Id<"users">;
}

export function UserInitials({ userId }: UserInitialsProps) {
  const user = useQuery(api.users.get, { id: userId });
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  return (
    <Tooltip content={`${user.firstName} ${user.lastName}`}>
      <div className="p-1 bg-teal-500 text-white rounded-full text-xs font-medium leading-none">
        {initials}
      </div>
    </Tooltip>
  );
}
