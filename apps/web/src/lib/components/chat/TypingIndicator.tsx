"use client";

import { cn } from "@eva/ui";
import type { TypingUser } from "@/lib/hooks/useTypingPresence";

function typingLabel(users: TypingUser[]): string {
  const names = users.map((user) => user.firstName);
  // Defaults guard against an empty array for the type checker; in practice the
  // indicator is only rendered with at least one user.
  const [first = "Someone", second = "Someone"] = names;
  if (names.length === 1) return `${first} is typing`;
  if (names.length === 2) return `${first} and ${second} are typing`;
  return `${first} and ${names.length - 1} others are typing`;
}

function TypingAvatar({ firstName }: { firstName: string }) {
  return (
    <span className="flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-medium text-primary-foreground">
      {firstName.charAt(0).toUpperCase()}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * Shows which teammates are typing in the current conversation: a stack of
 * initial avatars, a name label, and an animated dot pulse. Renders nothing
 * when nobody is typing, so a parent can position it absolutely (e.g.
 * `bottom-full`) without reserving layout space.
 *
 * Avatars are initial circles (matching DocPresenceFacepile) rather than the
 * richer facehash avatar: presence returns a plain string userId that cannot
 * be typed as Id<"users">, and the broadcast firstName is enough here.
 */
export function TypingIndicator({
  users,
  className,
}: {
  users: TypingUser[];
  className?: string;
}) {
  if (users.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="flex -space-x-1.5">
        {users.slice(0, 3).map((user) => (
          <TypingAvatar key={user.userId} firstName={user.firstName} />
        ))}
      </span>
      <span className="truncate">{typingLabel(users)}</span>
      <TypingDots />
    </div>
  );
}
