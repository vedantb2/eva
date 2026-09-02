/**
 * Assignee/name directory: the caller plus everyone on their teams.
 * `listAll` used to `collect()` the whole users table.
 */
export function collectDirectoryUserIds<TUserId>(
  self: TUserId,
  members: ReadonlyArray<{ userId: TUserId }>,
): TUserId[] {
  const ids = new Set<TUserId>([self]);
  for (const member of members) {
    ids.add(member.userId);
  }
  return [...ids];
}
