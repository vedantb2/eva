import { describe, expect, test } from "vitest";
import { buildEvaOrchestratorContent } from "../convex/_systemSkills/evaOrchestrator";
import { DRAIN_IDLE_STATUS } from "../convex/orchestratorShared";

/**
 * The skill is the orchestrator's only description of its own tools, so an
 * instruction that no longer matches the code is worse than a missing one — it
 * makes the agent confidently wrong. These pin the statements that depend on
 * behaviour implemented elsewhere.
 */
describe("the eva-orchestrator skill matches how the tools behave", () => {
  const content = buildEvaOrchestratorContent();

  test("it names every tool that is registered under the claim", () => {
    for (const tool of [
      "list_agents",
      "get_agent_state",
      "send_agent_message",
      "create_session",
      "stop_agent",
      "watch_agent",
      "unwatch_agent",
    ]) {
      expect(content).toContain(tool);
    }
  });

  test("it explains the notification statuses the notifier can emit", () => {
    // `orchestratorShared.decideChildOutcome` emits exactly these shapes.
    expect(content).toContain(DRAIN_IDLE_STATUS);
    expect(content).toContain("interrupted");
    // And warns against reading an interruption as completed work.
    expect(content).toMatch(/do not report that work as done/i);
  });

  test("it warns that a queued send does not overtake existing messages", () => {
    expect(content).toMatch(/already has messages waiting/i);
  });

  test("it warns that stopping a task also cancels its run", () => {
    expect(content).toMatch(/cancels \*\*both\*\* its chat turn and its main run/i);
  });

  test("it tells the agent to rely on wake-ups rather than polling", () => {
    expect(content).toMatch(/you do not need to poll/i);
    expect(content).toMatch(/never use `sleep`/i);
  });

  test("it documents prod logs coming from the shell, not a tool", () => {
    expect(content).toContain("There is no log tool");
    expect(content).toContain("npx convex logs");
  });

  test("it requires a status table and one message per agent per round", () => {
    expect(content).toContain("| Agent | Repo | Status | Doing |");
    expect(content).toMatch(/one consolidated message per agent per round/i);
  });
});
