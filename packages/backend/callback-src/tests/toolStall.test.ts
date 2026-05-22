import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeToolStallMessage,
  applyCanonicalEvents,
} from "../parse/canonical.js";
import { callbackState as S, resetStateForTests } from "../runtime/state.js";

test("long bash is not killed by parallel read on the bash clock", () => {
  resetStateForTests();
  S.inFlightToolUses = 2;
  S.activeToolStalls.set("bash1", {
    startedAt: Date.now() - 360000,
    timeoutMs: 2940000,
    label: "Running command...",
  });
  S.activeToolStalls.set("read1", {
    startedAt: Date.now() - 1000,
    timeoutMs: 300000,
    label: "Reading file...",
  });
  assert.equal(activeToolStallMessage(), "");
  resetStateForTests();
});

test("non-shell tool stalls on its own timer while bash still running", () => {
  resetStateForTests();
  S.inFlightToolUses = 2;
  S.activeToolStalls.set("bash1", {
    startedAt: Date.now() - 60000,
    timeoutMs: 2940000,
    label: "Running command...",
  });
  S.activeToolStalls.set("read1", {
    startedAt: Date.now() - 301000,
    timeoutMs: 300000,
    label: "Reading file...",
  });
  const message = activeToolStallMessage();
  assert.match(message, /Reading file/);
  assert.match(message, /300000ms/);
  resetStateForTests();
});

test("tool_result clears tracked tool by tool_use_id", () => {
  resetStateForTests();
  applyCanonicalEvents([
    {
      kind: "push_step",
      trackingId: "toolu_abc",
      step: {
        type: "bash",
        label: "Running command...",
        status: "active",
      },
    },
  ]);
  assert.equal(S.inFlightToolUses, 1);
  assert.equal(S.activeToolStalls.size, 1);
  applyCanonicalEvents([{ kind: "complete_tool", trackingId: "toolu_abc" }]);
  assert.equal(S.inFlightToolUses, 0);
  assert.equal(S.activeToolStalls.size, 0);
  resetStateForTests();
});
