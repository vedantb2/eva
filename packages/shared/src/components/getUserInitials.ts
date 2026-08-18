export interface UserFields {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  lastSeenAt?: number | null;
}

export function getUserInitials(user: UserFields): string {
  const firstLast =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  if (firstLast) return firstLast;
  if (user.fullName) {
    return user.fullName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return "?";
}
