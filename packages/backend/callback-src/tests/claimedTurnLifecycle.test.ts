import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import {
  appendClaimedTurnCompletion,
  claimedTurnLifecycleStatus,
  finishClaimedTurn,
  readClaimedTurn,
  startClaimedTurn,
} from "../providers/claimedTurnLifecycle.js";
import {
  canSendTurnHeartbeat,
  getCurrentTurnLease,
  setCurrentTurnLease,
} from "../runtime/turnLease.js";
import type { JsonObject } from "../types.js";

afterEach(() => {
  finishClaimedTurn();
});

describe("the shared claimed-turn lifecycle", () => {
  test("requires every durable claim to carry its ownership fence", () => {
    expect(() =>
      readClaimedTurn({
        prompt: "Fix it",
        turnLifecycle: "durable",
      }),
    ).toThrow("Durable claimed turn did not include a lease identity");
  });

  test("rejects a lease on a claim explicitly marked legacy", () => {
    expect(() =>
      readClaimedTurn({
        prompt: "Fix it",
        turnLifecycle: "legacy",
        turnId: "turn-1",
        leaseGeneration: 2,
      }),
    ).toThrow("Legacy claimed turn unexpectedly included a lease identity");
  });

  test("preserves durable ownership across heartbeat and completion", () => {
    const turn = readClaimedTurn({
      prompt: "Fix it",
      turnLifecycle: "durable",
      turnId: "turn-1",
      leaseGeneration: 2,
    });
    expect(turn).not.toBeNull();
    if (turn === null) return;

    startClaimedTurn(turn);

    expect(claimedTurnLifecycleStatus()).toBe("active");
    expect(
      canSendTurnHeartbeat({
        claimMutation: "sessions:claimPendingTurn",
        turnLease: getCurrentTurnLease(),
      }),
    ).toBe(true);
    const completion: JsonObject = { success: true };
    appendClaimedTurnCompletion(completion);
    expect(completion).toEqual({
      success: true,
      turnId: "turn-1",
      leaseGeneration: 2,
    });

    finishClaimedTurn();

    expect(claimedTurnLifecycleStatus()).toBe("idle");
    expect(getCurrentTurnLease()).toBeNull();
    expect(
      canSendTurnHeartbeat({
        claimMutation: "sessions:claimPendingTurn",
        turnLease: getCurrentTurnLease(),
      }),
    ).toBe(false);
  });

  test("keeps explicitly legacy claims unfenced", () => {
    const turn = readClaimedTurn({
      prompt: "Legacy task chat",
      turnLifecycle: "legacy",
    });
    expect(turn).not.toBeNull();
    if (turn === null) return;

    startClaimedTurn(turn);
    const completion: JsonObject = { success: true };
    appendClaimedTurnCompletion(completion);

    expect(getCurrentTurnLease()).toBeNull();
    expect(
      canSendTurnHeartbeat({
        claimMutation: "projectChatWorkflow:claimPendingTurn",
        turnLease: getCurrentTurnLease(),
      }),
    ).toBe(true);
    expect(completion).toEqual({ success: true });

    finishClaimedTurn();
    expect(
      canSendTurnHeartbeat({
        claimMutation: "projectChatWorkflow:claimPendingTurn",
        turnLease: getCurrentTurnLease(),
      }),
    ).toBe(false);
  });

  test("keeps the claimed completion fence even if heartbeat state drifts", () => {
    const turn = readClaimedTurn({
      prompt: "Fix it",
      turnLifecycle: "durable",
      turnId: "turn-1",
      leaseGeneration: 2,
    });
    expect(turn).not.toBeNull();
    if (turn === null) return;

    startClaimedTurn(turn);
    setCurrentTurnLease(null);
    const completion: JsonObject = { success: false };
    appendClaimedTurnCompletion(completion);

    expect(completion).toEqual({
      success: false,
      turnId: "turn-1",
      leaseGeneration: 2,
    });
  });

  test("does not allow overlapping claimed turns", () => {
    const turn = readClaimedTurn({
      prompt: "Fix it",
      turnLifecycle: "durable",
      turnId: "turn-1",
      leaseGeneration: 2,
    });
    expect(turn).not.toBeNull();
    if (turn === null) return;

    startClaimedTurn(turn);

    expect(() => startClaimedTurn(turn)).toThrow(
      "Cannot start a claimed turn while another claim is active",
    );
  });

  test("does not allow completion before a claim starts", () => {
    finishClaimedTurn();
    expect(() => appendClaimedTurnCompletion({ success: false })).toThrow(
      "Cannot complete a claimed turn before it starts",
    );
  });
});

describe("persistent providers obey the same lifecycle contract", () => {
  const providerPaths = [
    "providers/claudeSdkDaemon.ts",
    "providers/cursorSdkDaemon.ts",
    "providers/codexAppServerDaemon.ts",
  ];

  for (const providerPath of providerPaths) {
    test(providerPath, () => {
      const source = readSource(providerPath);
      expect(source).toContain("readClaimedTurn");
      expect(source).toContain("startClaimedTurn(turn)");
      expect(source).toContain("appendClaimedTurnCompletion(completionArgs)");
      expect(source).toContain("finishClaimedTurn()");
      expect(source).not.toContain("function readClaimedTurn(");
      expect(source).not.toContain("setCurrentTurnLease(turn.turnLease)");
    });
  }
});

function readSource(relativePath: string): string {
  return readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", relativePath),
    "utf8",
  ).replaceAll("\r\n", "\n");
}
