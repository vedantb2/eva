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

/**
 * Stable key of the daily standup install. The Today page and its sidebar tab
 * key off this, so it must never change once installs exist.
 */
export const DAILY_STANDUP_KEY = "daily-standup";

/**
 * The first line doubles as the Hub card blurb (cards line-clamp to two
 * lines), so it must read as a description before the instructions start.
 */
const DAILY_STANDUP_PROMPT = `Write the daily standup: a short, skimmable changelog of what shipped in this app over the last working day.

Gather the raw material with git: \`git log --since='36 hours ago' --pretty=format:'%h %ad %s' --date=short\`. If that window is empty, use the most recent day that has commits and say which day you covered. Read the diffs of the commits that matter before describing them.

Format the deliverable as markdown:
- Start with one bold line summarising the day in plain language
- Group work under a few short \`###\` headings by theme (features, fixes, infrastructure — whatever fits the day), each with 1-4 bullets
- Each bullet is one sentence on the user-visible outcome, not the implementation; no file paths, no commit hashes
- Skip merge commits, version bumps, lockfile churn and formatting-only changes entirely
- If something needs a teammate's attention (a revert, a hotfix, a breaking change), end with a single **Heads up:** line
- Keep the whole deliverable under ~150 words

If nothing meaningful shipped, the deliverable is the single line: \`No meaningful changes in the last day.\``;

export const SYSTEM_AUTOMATIONS: ReadonlyArray<SystemAutomationDefinition> = [
  {
    key: "daily-changelog",
    title: "Daily changelog",
    description: "Produce a changelog",
    defaultCronSchedule: "0 7 * * *",
    readOnly: true,
    actionsEnabled: false,
  },
  {
    key: DAILY_STANDUP_KEY,
    title: "Daily standup",
    description: DAILY_STANDUP_PROMPT,
    defaultCronSchedule: "30 6 * * *",
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
