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

test("evaluateAttemptHealth kills a stream silent beyond the mid-stream cap", () => {
  resetStateForTests();
  const result = evaluateAttemptHealth({
    childPid: 1234,
    // Events already flowed this attempt, so the first-event guard is passed.
    parsedEventsAtStart: S.parsedStreamEventCount - 1,
    attemptStartedAt: Date.now() - 12 * 60 * 1000,
    lastStdoutAt: Date.now() - 11 * 60 * 1000,
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  expect(result.timedOutForNoOutput).toBe(true);
  expect(result.shouldTerminate).toBe(true);
  resetStateForTests();
});

test("evaluateAttemptHealth exempts in-flight tools from the mid-stream silence cap", () => {
  resetStateForTests();
  setInFlightToolUsesForTest(1);
  const result = evaluateAttemptHealth({
    childPid: 1234,
    parsedEventsAtStart: S.parsedStreamEventCount - 1,
    attemptStartedAt: Date.now() - 12 * 60 * 1000,
    lastStdoutAt: Date.now() - 11 * 60 * 1000,
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  expect(result.timedOutForNoOutput).toBe(false);
  expect(result.shouldTerminate).toBe(false);
  resetStateForTests();
});
