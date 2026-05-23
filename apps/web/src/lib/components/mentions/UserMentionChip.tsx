"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import type { FunctionReturnType } from "convex/server";
import { api, PERSONALISATION_PRESETS } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import { UserInitials } from "@conductor/shared";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Spinner,
} from "@conductor/ui";
import { MENTION_CHIP_CLASS } from "./mentionChipStyles";

const ONLINE_THRESHOLD_MS = 120_000;

type UserProfile = NonNullable<FunctionReturnType<typeof api.users.get>>;

function getRoleLabel(role: UserProfile["role"]): string | null {
  if (role === "business" || role === "dev" || role === "designer") {
    return PERSONALISATION_PRESETS[role].label;
  }
  return null;
}

function getDisplayName(user: UserProfile): string {
  const fromParts = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fromParts) return fromParts;
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.email?.trim()) return user.email.trim();
  return "Unknown";
}

function getPresence(lastSeenAt?: number | null): {
  label: string;
  online: boolean;
} {
  if (!lastSeenAt) {
    return { label: "Offline", online: false };
  }
  const online = Date.now() - lastSeenAt < ONLINE_THRESHOLD_MS;
  if (online) {
    return { label: "Online", online: true };
  }
  return { label: `Active ${dayjs(lastSeenAt).fromNow()}`, online: false };
}

export function UserProfileHoverCardBody({ userId }: { userId: string }) {
  const user = useQuery(
    api.users.get,
    isUsersTableId(userId) ? { id: userId } : "skip",
  );

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (user === null) {
    return <p className="text-sm text-muted-foreground">User not found</p>;
  }

  const name = getDisplayName(user);
  const roleLabel = getRoleLabel(user.role);
  const presence = getPresence(user.lastSeenAt);

  return (
    <div className="flex items-start gap-3">
      {isUsersTableId(userId) ? (
        <UserInitials userId={userId} user={user} hideLastSeen size="lg" />
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold tracking-tight text-foreground">
          {name}
        </p>
        {roleLabel ? (
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        ) : null}
        {user.email ? (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span
            className={
              "size-1.5 shrink-0 rounded-full " +
              (presence.online ? "bg-success" : "bg-muted-foreground/50")
            }
            aria-hidden
          />
          <span className="text-xs text-muted-foreground">
            {presence.label}
          </span>
        </div>
      </div>
    </div>
  );
}

interface UserMentionChipProps {
  /** Convex user id from an `@[label](id)` mention token. */
  userId: string;
  label: string;
}

const USER_ID_PATTERN = /^[a-z0-9_]{16,40}$/;

function isUsersTableId(id: string): id is Id<"users"> {
  return USER_ID_PATTERN.test(id);
}

/** @mention pill with a Linear-style profile card on hover. */
export function UserMentionChip({ userId, label }: UserMentionChipProps) {
  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className={`${MENTION_CHIP_CLASS} cursor-default`} tabIndex={0}>
          @{label}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" side="top" className="w-72 p-3">
        <UserProfileHoverCardBody userId={userId} />
      </HoverCardContent>
    </HoverCard>
  );
}
