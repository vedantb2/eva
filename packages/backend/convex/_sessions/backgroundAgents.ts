import type { BackgroundAgentEntry } from "../_validators/tableFields";

/** Merges daemon background-agent patches into the session doc array by toolUseId. */
export function mergeBackgroundAgents(
  existing: BackgroundAgentEntry[] | undefined,
  patches: BackgroundAgentEntry[],
): BackgroundAgentEntry[] {
  const byToolUseId = new Map<string, BackgroundAgentEntry>();
  for (const entry of existing ?? []) {
    byToolUseId.set(entry.toolUseId, entry);
  }
  for (const patch of patches) {
    const previous = byToolUseId.get(patch.toolUseId);
    byToolUseId.set(
      patch.toolUseId,
      previous ? { ...previous, ...patch } : patch,
    );
  }
  return [...byToolUseId.values()];
}
