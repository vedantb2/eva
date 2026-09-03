import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * GitHub-locked skills that already live under `.claude/skills` must also
 * have an `.agents` copy. Cursor/Codex (and Eva's non-Claude `/` picker)
 * only scan `.agents/skills`; Eva repo-skill sync reads the base branch.
 * `code-structure` kept vanishing because only the Claude tree reached main.
 */
test("locked skills that exist under .claude are mirrored under .agents", () => {
  const lock = JSON.parse(
    readFileSync(join(repoRoot, "skills-lock.json"), "utf8"),
  ) as { skills: Record<string, unknown> };

  const missing: string[] = [];
  for (const name of Object.keys(lock.skills)) {
    const claude = join(repoRoot, ".claude/skills", name, "SKILL.md");
    const agents = join(repoRoot, ".agents/skills", name, "SKILL.md");
    if (existsSync(claude) && !existsSync(agents)) missing.push(name);
  }
  expect(missing, "install the .agents copy or drop the .claude one").toEqual(
    [],
  );
});
