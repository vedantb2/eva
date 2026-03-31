import type { ActivityStep } from "@conductor/ui";

export function parseActivitySteps(
  data: string | undefined,
): ActivityStep[] | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return parsed;
    }
  } catch {
    // Legacy plain text format
  }
  return null;
}
