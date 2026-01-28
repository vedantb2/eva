import { Tooltip } from "@heroui/react";

interface UserInitialsProps {
  firstName?: string;
  lastName?: string;
}

export function UserInitials({ firstName, lastName }: UserInitialsProps) {
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <Tooltip content={`${firstName} ${lastName}`}>
      <div className="p-1 bg-teal-500 text-white rounded-full text-xs font-medium leading-none">
        {initials}
      </div>
    </Tooltip>
  );
}
