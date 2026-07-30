import { describe, expect, test } from "vitest";
import {
  STALE_FINISHING_THRESHOLD_MS,
  STALE_NO_SANDBOX_THRESHOLD_MS,
  STALE_THRESHOLD_MS,
  STALE_TOOL_ACTIVE_THRESHOLD_MS,
  staleTurnDecision,
} from "../convex/_taskWorkflow/staleness";

const NOW = 1_800_000_000_000;
const MIN = 60_000;

function step(label: string, status: string): string {
  return JSON.stringify([{ type: "tool", label, status }]);
}

/**
 * The observed prod failure: an agent process died mid-turn (OOM), its last
 * steps sat completed in the streaming row, and the chat hung on "Working…"
 * for the 2h backstop. These pin the decision that now catches it in minutes
 * without killing legitimately-quiet phases (startup installs, long builds).
 */
describe("staleTurnDecision", () => {
  test("a fresh heartbeat is never stale", () => {
    const decision = staleTurnDecision({
      currentActivity: step("Running command...", "active"),
      lastUpdatedAt: NOW - 5_000,
      turnStartedAt: NOW - 10 * MIN,
      hasSandbox: true,
      now: NOW,
    });
    expect(decision.stale).toBe(false);
  });

  test("completed steps with a dead heartbeat go stale on the idle threshold", () => {
    // The prod incident shape: past-tense completed steps, no active step,
    // heartbeat silent for 11+ minutes.
    const decision = staleTurnDecision({
      currentActivity: step("Read file", "complete"),
      lastUpdatedAt: NOW - 11 * MIN,
      turnStartedAt: NOW - 23 * MIN,
      hasSandbox: true,
      now: NOW,
    });
    expect(decision.phase).toBe("idle");
    expect(decision.thresholdMs).toBe(STALE_THRESHOLD_MS);
    expect(decision.stale).toBe(true);
  });

  test("sandbox startup steps get the long startup threshold", () => {
    const installing = step("Installing dependencies...", "active");
    const base = {
      currentActivity: installing,
      turnStartedAt: NOW - 30 * MIN,
      hasSandbox: true,
      now: NOW,
    };
    const quiet = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 10 * MIN,
    });
    expect(quiet.phase).toBe("startup");
    expect(quiet.thresholdMs).toBe(STALE_NO_SANDBOX_THRESHOLD_MS);
    expect(quiet.stale).toBe(false);
    const dead = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 16 * MIN,
    });
    expect(dead.stale).toBe(true);
  });

  test("an active tool step gets the extended tool threshold", () => {
    const building = step("Running command...", "active");
    const base = {
      currentActivity: building,
      turnStartedAt: NOW - 60 * MIN,
      hasSandbox: true,
      now: NOW,
    };
    const quiet = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 10 * MIN,
    });
    expect(quiet.phase).toBe("tool");
    expect(quiet.thresholdMs).toBe(STALE_TOOL_ACTIVE_THRESHOLD_MS);
    expect(quiet.stale).toBe(false);
    const dead = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 26 * MIN,
    });
    expect(dead.stale).toBe(true);
  });

  test("finalization gets the finishing threshold", () => {
    const finalizing = step("Finalizing response...", "active");
    const decision = staleTurnDecision({
      currentActivity: finalizing,
      lastUpdatedAt: NOW - 11 * MIN,
      turnStartedAt: NOW - 40 * MIN,
      hasSandbox: true,
      now: NOW,
    });
    expect(decision.phase).toBe("finishing");
    expect(decision.thresholdMs).toBe(STALE_FINISHING_THRESHOLD_MS);
    expect(decision.stale).toBe(true);
  });

  test("no streaming row and no sandbox counts as startup", () => {
    const decision = staleTurnDecision({
      currentActivity: undefined,
      lastUpdatedAt: undefined,
      turnStartedAt: NOW - 10 * MIN,
      hasSandbox: false,
      now: NOW,
    });
    expect(decision.phase).toBe("startup");
    expect(decision.stale).toBe(false);
  });

  test("no streaming row on an attached sandbox is drift, not startup", () => {
    // A warm sandbox whose row was wiped at staging and never touched again:
    // after the 2-minute drift window this is a dead claim, not a slow boot.
    const decision = staleTurnDecision({
      currentActivity: undefined,
      lastUpdatedAt: undefined,
      turnStartedAt: NOW - 6 * MIN,
      hasSandbox: true,
      now: NOW,
    });
    expect(decision.phase).toBe("idle");
    expect(decision.stale).toBe(true);
  });

  test("the staleness clock never starts before the turn", () => {
    // A leftover row from a previous turn must not make a brand-new turn
    // instantly stale.
    const decision = staleTurnDecision({
      currentActivity: undefined,
      lastUpdatedAt: NOW - 30 * MIN,
      turnStartedAt: NOW - MIN,
      hasSandbox: true,
      now: NOW,
    });
    expect(decision.ageMs).toBe(MIN);
    expect(decision.stale).toBe(false);
  });
});
