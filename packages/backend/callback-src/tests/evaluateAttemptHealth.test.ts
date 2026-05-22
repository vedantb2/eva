import assert from "node:assert/strict";
import { test } from "node:test";
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
  assert.equal(result.shouldTerminate, true);
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
  assert.equal(result.shouldTerminate, false);
  resetStateForTests();
});

test("evaluateAttemptHealth detects no-output timeout when idle", () => {
  resetStateForTests();
  const result = evaluateAttemptHealth({
    childPid: 1234,
    parsedEventsAtStart: S.parsedStreamEventCount,
    attemptStartedAt: Date.now(),
    lastStdoutAt: Date.now() - 120000,
    processLabel: "test",
    toolStallErrorMessage: "",
  });
  assert.equal(result.timedOutForNoOutput, true);
  assert.equal(result.shouldTerminate, true);
});
