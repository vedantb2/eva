import { describe, expect, test } from "vitest";
import {
  decideCallbackRefresh,
  type CallbackRefreshState,
} from "../providers/callbackRefresh.js";

const idlePendingRefresh: CallbackRefreshState = {
  refreshPending: true,
  watchedTurnActive: false,
  daemonTurnActive: false,
  claimedTurnPending: false,
  cancellationInFlight: false,
  backgroundAgentCount: 0,
  sdkMessagePending: false,
  syntheticTurnOpening: false,
};

describe("callback refresh decisions", () => {
  test("keeps polling when the callback is current", () => {
    expect(
      decideCallbackRefresh({
        ...idlePendingRefresh,
        refreshPending: false,
      }),
    ).toEqual({ action: "poll" });
  });

  test("an idle stale daemon exits between turns", () => {
    expect(decideCallbackRefresh(idlePendingRefresh)).toEqual({
      action: "exit",
    });
  });

  test.each([
    ["watched turn", { watchedTurnActive: true }, "watched-turn"],
    ["daemon turn", { daemonTurnActive: true }, "daemon-turn"],
    ["claimed turn", { claimedTurnPending: true }, "claimed-turn"],
    ["cancellation", { cancellationInFlight: true }, "cancellation"],
    ["background agent", { backgroundAgentCount: 1 }, "background-agent"],
    ["SDK message", { sdkMessagePending: true }, "sdk-message"],
    [
      "opening synthetic turn",
      { syntheticTurnOpening: true },
      "synthetic-turn-opening",
    ],
  ])("defers for %s", (_label, state, blocker) => {
    expect(decideCallbackRefresh({ ...idlePendingRefresh, ...state })).toEqual({
      action: "defer",
      blocker,
    });
  });

  test("reports the first blocker deterministically", () => {
    expect(
      decideCallbackRefresh({
        ...idlePendingRefresh,
        watchedTurnActive: true,
        claimedTurnPending: true,
        syntheticTurnOpening: true,
      }),
    ).toEqual({ action: "defer", blocker: "watched-turn" });
  });
});
