import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyTurnKind } from "../convex/_sessions/turnKind";

test("classifyTurnKind marks simple math as conversational", () => {
  assert.equal(
    classifyTurnKind(
      "loop latency test: what is 11+11? Reply with just the number.",
    ),
    "conversational",
  );
  assert.equal(classifyTurnKind("what is 12+12?"), "conversational");
});

test("classifyTurnKind marks code tasks as agent", () => {
  assert.equal(classifyTurnKind("implement dark mode in apps/web"), "agent");
  assert.equal(
    classifyTurnKind("run ls in the repo root and list files"),
    "agent",
  );
});
