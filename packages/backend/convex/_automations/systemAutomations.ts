import type { Doc } from "../_generated/dataModel";

/**
 * A system automation shipped with eva. The definition lives in code, so
 * changing an entry here updates every repo that has it installed. The schedule
 * is the exception: it is seeded from the catalog at install time and is then
 * the user's to change, like any other automation.
 */
export interface SystemAutomationDefinition {
  /** Stable identifier stored on the install row as `systemKey`. */
  key: string;
  title: string;
  /** Prompt the agent runs each time. */
  description: string;
  /** Standard 5-field cron expression in UTC, seeded onto new installs. */
  defaultCronSchedule: string;
  /** Report-only runs never push a branch or open a PR. */
  readOnly: boolean;
  /** Whether the run parses actionable findings that can become tasks. */
  actionsEnabled: boolean;
}

export const SYSTEM_AUTOMATIONS: ReadonlyArray<SystemAutomationDefinition> = [
  {
    key: "daily-changelog",
    title: "Daily changelog",
    description: "Produce a changelog",
    defaultCronSchedule: "0 7 * * *",
    readOnly: true,
    actionsEnabled: false,
  },
];

/** Looks up a catalog entry; undefined once an entry is removed from the code. */
export function getSystemAutomation(
  key: string,
): SystemAutomationDefinition | undefined {
  return SYSTEM_AUTOMATIONS.find((entry) => entry.key === key);
}

/**
 * Overlays the code-defined definition onto an install row. A read-only view:
 * the returned doc must never be written back. Non-system rows, and installs
 * whose key no longer exists in the catalog, pass through unchanged (the latter
 * keep their stored fallback title and stay non-runnable via an empty prompt).
 *
 * `cronSchedule` is deliberately not overlaid — it belongs to the install.
 */
export function resolveAutomationDoc(
  doc: Doc<"automations">,
): Doc<"automations"> {
  if (doc.systemKey === undefined) return doc;
  const entry = getSystemAutomation(doc.systemKey);
  if (!entry) return doc;
  return {
    ...doc,
    title: entry.title,
    description: entry.description,
    readOnly: entry.readOnly,
    actionsEnabled: entry.actionsEnabled,
  };
}
