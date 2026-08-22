import type { AIProvider } from "@eva/backend";

/**
 * Built-in skills each CLI harness ships with, surfaced in the `/` picker so
 * users can invoke them like repo skills. The harness executes them natively —
 * the backend strips the chip token down to the literal `/name` (see
 * `convex/_mentions/resolveSkillMentions.ts`), so nothing is materialized in
 * the sandbox and no content sync is needed.
 *
 * The Claude list is curated from the Agent SDK init handshake
 * (`initializationResult().commands`) of the Claude Code build the sandboxes
 * run (2.1.239): agent-invocable prompt skills only. Local/terminal-UI
 * commands (`/clear`, `/config`, `/usage`, …) and ones that fight Eva's own
 * orchestration (`/batch`) are left out. Descriptions are the harness's own,
 * trimmed to their first sentence for the picker row.
 */
export interface HarnessSkill {
  name: string;
  description: string;
}

export const CLAUDE_HARNESS_SKILLS: readonly HarnessSkill[] = [
  {
    name: "loop",
    description:
      "Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo, defaults to 10m)",
  },
  {
    name: "goal",
    description: "Set a goal Claude checks before stopping",
  },
  {
    name: "compact",
    description: "Free up context by summarizing the conversation so far",
  },
  {
    name: "deep-research",
    description:
      "Deep research harness — fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report",
  },
  {
    name: "verify",
    description:
      "Verify that a code change actually does what it's supposed to by exercising it end-to-end and observing behavior",
  },
  {
    name: "code-review",
    description:
      "Review the current diff for correctness bugs and reuse/simplification/efficiency cleanups",
  },
  {
    name: "review",
    description:
      "Review a GitHub pull request; for your working diff use /code-review",
  },
  {
    name: "simplify",
    description:
      "Review the changed code for reuse, simplification, efficiency, and altitude cleanups, then apply the fixes",
  },
  {
    name: "security-review",
    description:
      "Complete a security review of the pending changes on the current branch",
  },
  {
    name: "init",
    description: "Initialize a new CLAUDE.md file with codebase documentation",
  },
  {
    name: "run",
    description:
      "Launch and drive this project's app to see a change working in the real app, not just tests",
  },
  {
    name: "dataviz",
    description:
      "Create charts, graphs, plots, and dashboards that read as one system — elegant, accessible, consistent in light and dark",
  },
  {
    name: "claude-api",
    description:
      "Reference for the Claude API / Anthropic SDK — model ids, pricing, params, streaming, tool use, MCP, agents, caching",
  },
];

/** Built-in skills for the harness a provider runs, if we know its catalog. */
export function harnessSkillsForProvider(
  provider: AIProvider | undefined,
): readonly HarnessSkill[] {
  return provider === "claude" ? CLAUDE_HARNESS_SKILLS : [];
}
