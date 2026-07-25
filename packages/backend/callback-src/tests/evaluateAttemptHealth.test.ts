import { test, expect } from "vitest";
import { evaluateAttemptHealth } from "../runtime/cliAttempt.js";
import {
  callbackState as S,
  resetStateForTests,
  setFatalHeartbeatForTest,
  setInFlightToolUsesForTest,
} from "../runtime/state.js";

test("evaluateAttemptHealth terminates on fatal heartbeat message", () => {
  resetStateForTests();
  setFatalHeartbeatForTest("lost heartbeat");
  const result = evaluateAttemptHealth({
    childPid: 1234,
    parsedEventsAtStart: S.parsedStreamEventCount,
    attemptStartedAt: Date.now(),
    lastStdoutAt: Date.now(),
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  expect(result.shouldTerminate).toBe(true);
  resetStateForTests();
});

test("evaluateAttemptHealth allows silence while tool in flight without stall", () => {
  resetStateForTests();
  setInFlightToolUsesForTest(1);
  const result = evaluateAttemptHealth({
    childPid: 1234,
    parsedEventsAtStart: S.parsedStreamEventCount,
    attemptStartedAt: Date.now(),
    lastStdoutAt: Date.now() - 120000,
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  expect(result.shouldTerminate).toBe(false);
  resetStateForTests();
});

test("evaluateAttemptHealth allows long stdout silence while idle", () => {
  resetStateForTests();
  const result = evaluateAttemptHealth({
    childPid: 1234,
    parsedEventsAtStart: S.parsedStreamEventCount,
    attemptStartedAt: Date.now(),
    lastStdoutAt: Date.now() - 120000,
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  expect(result.timedOutForNoOutput).toBe(false);
  expect(result.shouldTerminate).toBe(false);
  resetStateForTests();
});
