/**
 * Stable identity for project-interview transcript entries.
 *
 * New entries carry UUIDs. The deterministic fallback keeps pre-migration
 * rows addressable without coupling React keys or answer validation to array
 * positions.
 */
export function projectConversationMessageKey(
  id: string | undefined,
  role: "user" | "assistant",
  startedAt: number | undefined,
  finishedAt: number | undefined,
  content: string,
): string {
  if (id !== undefined) return id;

  let hash = 2166136261;
  const source = `${role}\u0000${startedAt ?? ""}\u0000${finishedAt ?? ""}\u0000${content}`;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `legacy:${hash >>> 0}`;
}
