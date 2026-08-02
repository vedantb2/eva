/** Canonical tag vocabulary. The model may only pick from this list. */
export const TASK_TAGS = [
  "bug",
  "feature",
  "refactor",
  "docs",
  "testing",
  "chore",
  "migration",
  "performance",
  "security",
  "accessibility",
  "reliability",
  "design",
  "ux",
  "frontend",
  "backend",
  "database",
  "infra",
  "ci",
  "auth",
  "dependencies",
  "config",
  "integration",
] as const;

export type TaskTag = (typeof TASK_TAGS)[number];

/** Most tags one generation may add. Not a limit on a task's total tags. */
export const MAX_GENERATED_TAGS = 3;

const TASK_TAG_BY_VALUE: ReadonlyMap<string, TaskTag> = new Map(
  TASK_TAGS.map((tag) => [tag, tag]),
);

/**
 * Turns the model's comma-separated reply into valid tags. Drops anything
 * off-vocabulary, anything the user already applied, and duplicates. Emits
 * canonical lowercase entries from {@link TASK_TAGS}.
 */
export function parseGeneratedTags(
  raw: string,
  alreadyApplied: readonly string[],
): TaskTag[] {
  const applied = new Set(
    alreadyApplied.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );
  const picked: TaskTag[] = [];
  const seen = new Set<string>();

  for (const part of raw.split(/[,\n]+/)) {
    if (picked.length >= MAX_GENERATED_TAGS) break;

    let token = part.trim().toLowerCase();
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith("`") && token.endsWith("`"))
    ) {
      token = token.slice(1, -1).trim().toLowerCase();
    }
    if (!token) continue;

    const tag = TASK_TAG_BY_VALUE.get(token);
    if (tag === undefined) continue;
    if (applied.has(tag) || seen.has(tag)) continue;

    seen.add(tag);
    picked.push(tag);
  }

  return picked;
}
