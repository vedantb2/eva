import { describe, expect, it } from "vitest";
import {
  harnessSlashItems,
  isClaudeSkillSourcePath,
  selectRepoSkillsForProvider,
} from "@/lib/hooks/useSkillSlashItems";
import { CLAUDE_HARNESS_SKILLS } from "@/lib/components/mentions/harnessSkills";
import {
  SKILL_TOKEN_REGEX,
  formatSkillToken,
  harnessSkillTokenId,
  isSkillTokenId,
} from "@/lib/components/mentions/skillToken";

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

describe("harnessSlashItems", () => {
  it("lists Claude built-ins only for the claude provider", () => {
    const claudeItems = harnessSlashItems("claude", []);
    expect(claudeItems.map((item) => item.label)).toContain("loop");
    expect(claudeItems.every((item) => item.badge === "Claude")).toBe(true);
    expect(harnessSlashItems("cursor", [])).toEqual([]);
    expect(harnessSlashItems(undefined, [])).toEqual([]);
  });

  it("lets a repo or Eva skill of the same name shadow the built-in", () => {
    const labels = harnessSlashItems("claude", [{ label: "loop" }]).map(
      (item) => item.label,
    );
    expect(labels).not.toContain("loop");
    expect(labels).toContain("init");
  });
});

describe("harnessSkillTokenId", () => {
  it("stays inside the token grammar for every built-in", () => {
    for (const skill of CLAUDE_HARNESS_SKILLS) {
      const id = harnessSkillTokenId(skill.name);
      const token = formatSkillToken(skill.name, id);
      const matches = [...token.matchAll(SKILL_TOKEN_REGEX)];
      expect(matches).toHaveLength(1);
      expect(matches[0]?.[2]).toBe(id);
      // Not a Convex id — the hover card must not query repoSkills with it.
      expect(isSkillTokenId(id)).toBe(false);
    }
  });
});
