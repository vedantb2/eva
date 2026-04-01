import { UserInitials } from "@conductor/shared";
import { Avatar, AvatarFallback } from "@conductor/ui";
import type { Id } from "@conductor/backend";

export function UserMessageAvatar({
  userId,
  className = "h-7 w-7",
}: {
  userId?: Id<"users">;
  className?: string;
}) {
  if (userId) {
    return <UserInitials userId={userId} hideLastSeen size="md" />;
  }
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-secondary text-xs text-muted-foreground">
        U
      </AvatarFallback>
    </Avatar>
  );
}
