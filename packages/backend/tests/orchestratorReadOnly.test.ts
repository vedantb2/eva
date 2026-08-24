import { describe, expect, test } from "vitest";
import { buildEvaOrchestratorContent } from "../convex/_systemSkills/evaOrchestrator";
import {
  buildEditPrompt,
  buildOrchestratorPrompt,
} from "../convex/_sessions/prompts";
import {
  ORCHESTRATOR_TOOLS,
  SESSION_TOOLS,
  sessionTurnTools,
} from "../convex/_sessions/workflow";

/**
 * Manager Ave supervises agents and must never implement. She used to receive
 * `buildEditPrompt` — which opens with "Do all work on <branch>" and hands over
 * a `git commit` line — and did exactly what it said. These pin the three
 * layers that stop it: the tool list, the turn prompt, and the skill.
 */
describe("the master session cannot implement", () => {
  test("its tool set drops the two tools that make edits possible", () => {
    const tools = sessionTurnTools(true).allowedTools.split(",");
    expect(tools).not.toContain("Write");
    expect(tools).not.toContain("Edit");
    // Read-only inspection and the log-reading shell the skill documents.
    expect(tools).toEqual(expect.arrayContaining(["Read", "Glob", "Grep"]));
    expect(tools).toContain("Bash");
  });

  test("ordinary sessions keep the full tool set", () => {
    expect(sessionTurnTools(undefined).allowedTools).toBe(SESSION_TOOLS);
    expect(sessionTurnTools(false).allowedTools).toBe(SESSION_TOOLS);
    expect(sessionTurnTools(true).allowedTools).toBe(ORCHESTRATOR_TOOLS);
  });

  test("only the master carries the cross-provider no-writes flag", () => {
    expect(sessionTurnTools(true).noWrites).toBe(true);
    // Absent, not false: these objects are spread into launch args, and an
    // extra key would change every writing session's daemon opts signature.
    expect(sessionTurnTools(undefined)).not.toHaveProperty("noWrites");
    expect(sessionTurnTools(false)).not.toHaveProperty("noWrites");
  });

  test("its turn prompt carries no branch or commit contract", () => {
    const prompt = buildOrchestratorPrompt("look into the login bug", "");
    // The exact instructions it was following before. Asserted as the
    // instruction forms, not bare substrings: the prompt does mention
    // `git commit` — to forbid it, which is the opposite failure.
    expect(prompt).not.toMatch(/do all work on/i);
    expect(prompt).not.toMatch(/if you change code/i);
    expect(prompt).not.toContain("git add -A");
    expect(prompt).not.toMatch(/gh pr create/i);
    expect(prompt).toMatch(/no `git commit`, no `git push`/i);
  });

  test("its turn prompt forbids implementing and names the delegation tools", () => {
    const prompt = buildOrchestratorPrompt("fix the login bug", "");
    expect(prompt).toMatch(/never implement/i);
    expect(prompt).toContain("create_session");
    expect(prompt).toContain("send_agent_message");
  });

  test("its turn prompt still carries the user's custom instructions", () => {
    const prompt = buildOrchestratorPrompt(
      "status please",
      "\n\n## Custom Instructions\nBe terse.",
    );
    expect(prompt).toContain("Be terse.");
  });

  test("the edit prompt it no longer receives is still the implementing one", () => {
    // Guards the premise of this whole test file: if `buildEditPrompt` ever
    // stopped instructing edits, the split above would be pointless.
    const prompt = buildEditPrompt(
      { owner: "acme", name: "web", baseBranch: "main" },
      "eva/session-x",
      "",
      "fix the login bug",
      "",
      "",
      undefined,
    );
    expect(prompt).toMatch(/do all work on/i);
    expect(prompt).toContain("git commit");
  });

  test("the skill no longer licenses doing the work itself", () => {
    const content = buildEvaOrchestratorContent();
    expect(content).not.toMatch(/does not stop you doing work yourself/i);
    expect(content).toMatch(/never build anything yourself/i);
    expect(content).toMatch(/never implement/i);
    // The shell survives, but described as read-only.
    expect(content).toContain("read-only");
    expect(content).toContain("npx convex logs");
  });
});
