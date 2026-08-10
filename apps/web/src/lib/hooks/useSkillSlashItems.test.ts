import { describe, expect, it } from "vitest";
import {
  isClaudeSkillSourcePath,
  selectRepoSkillsForProvider,
} from "@/lib/hooks/useSkillSlashItems";

const skills = [
  {
    title: "review",
    sourcePath: ".agents/skills/review/SKILL.md",
    available: true,
  },
  {
    title: "review",
    sourcePath: ".claude/skills/review/SKILL.md",
    available: true,
  },
  {
    title: "claude-only",
    sourcePath: ".claude/skills/claude-only/SKILL.md",
    available: true,
  },
  {
    title: "disabled",
    sourcePath: ".agents/skills/disabled/SKILL.md",
    available: false,
  },
];

describe("selectRepoSkillsForProvider", () => {
  it("prefers Claude's copy and includes Claude-only skills for Claude", () => {
    expect(
      selectRepoSkillsForProvider(skills, "claude").map(
        (skill) => skill.sourcePath,
      ),
    ).toEqual([
      ".claude/skills/review/SKILL.md",
      ".claude/skills/claude-only/SKILL.md",
    ]);
  });

  it("keeps provider-specific skills out of non-Claude chats", () => {
    expect(
      selectRepoSkillsForProvider(skills, "cursor").map(
        (skill) => skill.sourcePath,
      ),
    ).toEqual([".agents/skills/review/SKILL.md"]);
  });

  it("recognizes Claude skill paths for popup badges", () => {
    expect(isClaudeSkillSourcePath(".claude/skills/review/SKILL.md")).toBe(
      true,
    );
    expect(isClaudeSkillSourcePath(".agents/skills/review/SKILL.md")).toBe(
      false,
    );
  });
});
