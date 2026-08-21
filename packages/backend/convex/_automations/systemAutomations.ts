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
const DAILY_STANDUP_PROMPT = `Write the daily standup: a short, friendly summary of what changed in this app since the last working day, written for the people who use it.

Gather the raw material with git. Cover everything since the previous working day: \`git log --since='36 hours ago' --pretty=format:'%h %ad %s' --date=short\`, but on a Monday use \`--since='4 days ago'\` so Friday and the weekend are included. If the window is empty, use the most recent day that has commits and say which day you covered. Read the diffs of the commits that matter, so you can describe what they changed for a user.

The audience is non-technical. They care about what they can now do, what got faster, and what got fixed. They do not care about how it was built.

Rules:
- Start with one bold line summarising the day in plain language
- Group the changes under whichever of these \`###\` headings apply: New, Faster, Fixed, Improved
- Write each change as one plain-language sentence about what is different for the user, and be specific about the benefit
- No jargon, no file or function names, no commit hashes, no architecture or implementation detail
- Skip anything with no user-facing impact: refactors, dependency bumps, tests, formatting, merge commits
- If something needs a teammate's attention (a revert, a hotfix, a breaking change), end with a single **Heads up:** line
- Keep the whole deliverable under ~150 words

If nothing user-facing shipped, the deliverable is the single line: \`No user-facing changes since the last working day.\``;

export const SYSTEM_AUTOMATIONS: ReadonlyArray<SystemAutomationDefinition> = [
  {
    key: DAILY_STANDUP_KEY,
    title: "Daily standup",
    description: DAILY_STANDUP_PROMPT,
    defaultCronSchedule: "0 8 * * 1-5",
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
