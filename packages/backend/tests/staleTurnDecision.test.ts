import { describe, expect, test } from "vitest";
import {
  STALE_FINISHING_THRESHOLD_MS,
  STALE_NO_SANDBOX_THRESHOLD_MS,
  STALE_THRESHOLD_MS,
  STALE_UNVERIFIED_KILL_THRESHOLD_MS,
  staleProbeFollowUp,
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

  test("an active tool step goes stale on the ordinary threshold — probe early, kill late", () => {
    // The 18 Aug 2026 prod incident: a project-chat callback died mid-tool
    // and the user stared at "Working…" for 25 minutes, because the tool
    // phase used to gate the FIRST probe on the 25-minute value. The probe
    // never kills live work (confirmed-alive → touch), so a silent tool must
    // become probe-eligible at the same 5 minutes as everything else; the
    // 25-minute value survives only as the unverified kill ceiling (see the
    // staleProbeFollowUp tests below).
    const building = step("Running command...", "active");
    const base = {
      currentActivity: building,
      turnStartedAt: NOW - 60 * MIN,
      hasSandbox: true,
      now: NOW,
    };
    const quiet = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 4 * MIN,
    });
    expect(quiet.phase).toBe("tool");
    expect(quiet.thresholdMs).toBe(STALE_THRESHOLD_MS);
    expect(quiet.stale).toBe(false);
    const dead = staleTurnDecision({
      ...base,
      lastUpdatedAt: NOW - 6 * MIN,
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

/**
 * What the pre-kill liveness probe does with a verifySandboxLiveness result.
 * A confirmed-dead callback dies at the ordinary threshold; an unverifiable
 * one (provider API unreachable) gets until the 25-minute ceiling, with the
 * staleness clock left running (no touch) so that ceiling is actually
 * reachable.
 */
describe("staleProbeFollowUp", () => {
  test("a confirmed-alive callback resets the clock", () => {
    expect(
      staleProbeFollowUp({
        alive: true,
        reason: "sandbox_started_pid_alive",
        streamingAgeMs: 6 * MIN,
      }),
    ).toBe("confirmed_alive");
  });

  test("a confirmed-dead callback is killed at the ordinary threshold", () => {
    expect(
      staleProbeFollowUp({
        alive: false,
        reason: "pid_dead_or_exec_failed",
        streamingAgeMs: 6 * MIN,
      }),
    ).toBe("kill");
  });

  test("an unreachable probe under the ceiling waits without resetting the clock", () => {
    expect(
      staleProbeFollowUp({
        alive: true,
        reason: "probe_unreachable_refresh",
        streamingAgeMs: 6 * MIN,
      }),
    ).toBe("await_verification");
  });

  test("an unreachable probe past the ceiling kills anyway", () => {
    // Silent heartbeat (sandbox → Convex) AND unreachable provider (Convex →
    // provider API) for 25+ minutes: dead by every independent signal.
    expect(
      staleProbeFollowUp({
        alive: true,
        reason: "probe_unreachable_get_sandbox",
        streamingAgeMs: STALE_UNVERIFIED_KILL_THRESHOLD_MS + MIN,
      }),
    ).toBe("kill");
  });
});
