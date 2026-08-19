import type { ActivityStep } from "@eva/ui";

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

/**
 * Whether `data` is a well-formed activity payload carrying zero steps — the
 * writer is alive and publishing, it just has nothing to report.
 *
 * `parseActivitySteps` collapses "no payload yet" and "empty payload" into the
 * same `null`, so callers that render a placeholder cannot tell ordinary
 * startup lag from a provider stream that has gone silent for minutes.
 */
export function isEmptyActivityPayload(data: string | undefined): boolean {
  if (!data) return false;
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
}
