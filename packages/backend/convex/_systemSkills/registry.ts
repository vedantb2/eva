import { buildEvaCaptureContent } from "./evaCapture";
import { buildEvaAuditContent } from "./evaAudit";
import { buildEvaOrchestratorContent } from "./evaOrchestrator";

/**
 * Eva-provided ("system") skills. Definitions live here rather than in a table
 * so they can be updated by deploying, and so the installed artefact in a repo
 * checkout stays a thin stub that fetches the real content over MCP.
 */
export const SYSTEM_SKILL_NAMES = [
  "eva-capture",
  "eva-audit",
  "eva-orchestrator",
] as const;

export type SystemSkillName = (typeof SYSTEM_SKILL_NAMES)[number];

/** Per-repo values baked into the content served by the `get_skill` MCP tool. */
export type SystemSkillHydration = {
  owner: string;
  name: string;
  rootDirectory?: string;
  devPort?: number;
  devCommand?: string;
  startupCommands?: string[];
  baseBranch: string;
};

export type SystemSkillDefinition = {
  name: SystemSkillName;
  /** Frontmatter description — drives harness auto-trigger. Keep single-line. */
  description: string;
  buildContent: (hydration: SystemSkillHydration) => string;
};

/**
 * Marks a SKILL.md as Eva-materialized. Stubs carrying it are overwritten and
 * pruned freely; a same-named file without it is user-owned and never touched.
 * Duplicated in `callback-src/runtime/systemSkills.ts` (no shared import path).
 */
export const SYSTEM_SKILL_MARKER = "<!-- eva:system-skill -->";

export const SYSTEM_SKILLS: Record<SystemSkillName, SystemSkillDefinition> = {
  "eva-capture": {
    name: "eva-capture",
    description:
      "Capture visual proof of UI changes with the shared browser and leave recordings or screenshots for Eva to attach to the chat. Use when the user asks for a recording, walkthrough, screenshot, or proof that a change works.",
    buildContent: buildEvaCaptureContent,
  },
  "eva-audit": {
    name: "eva-audit",
    description:
      "Audit this branch against Eva's standard review categories and report the findings in chat. Use when the user asks for a code audit, a review of this branch, or a quality check before shipping.",
    buildContent: buildEvaAuditContent,
  },
  // Delivered to the master session by the launch path, not by a repo install:
  // being the orchestrator is a property of the session, not of its repo.
  "eva-orchestrator": {
    name: "eva-orchestrator",
    description:
      "Supervise the other Eva agents running under this user: check what they are doing, message them, start new ones, and report their status. Use when acting as the master session coordinating other agents.",
    buildContent: buildEvaOrchestratorContent,
  },
};

export function isSystemSkillName(name: string): name is SystemSkillName {
  return name in SYSTEM_SKILLS;
}

export function listSystemSkills(): SystemSkillDefinition[] {
  return SYSTEM_SKILL_NAMES.map((name) => SYSTEM_SKILLS[name]);
}

/**
 * The file written into `.agents/skills/<name>/SKILL.md`. Deliberately carries
 * no instructions of its own — the agent fetches those over MCP on invoke.
 */
export function buildStubMarkdown(definition: SystemSkillDefinition): string {
  return `---
name: ${definition.name}
description: ${definition.description}
---

${SYSTEM_SKILL_MARKER}

# ${definition.name}

This is an Eva system skill. Its instructions live on the Eva server so they stay current — they are not in this file.

1. Call the \`get_skill\` tool on the \`eva\` MCP server with \`{"name": "${definition.name}"}\`.
2. Follow the instructions it returns for the rest of this request.
3. If the tool is missing or returns an error, stop and tell the user that the Eva MCP server is unavailable, so \`${definition.name}\` cannot run. Do not improvise a replacement.
`;
}
