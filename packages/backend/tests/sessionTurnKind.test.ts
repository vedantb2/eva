import { test, expect } from "vitest";
import { classifyTurnKind } from "../convex/_sessions/turnKind";

test("classifyTurnKind marks simple math as conversational", () => {
  expect(
    classifyTurnKind(
      "loop latency test: what is 11+11? Reply with just the number.",
    ),
  ).toBe("conversational");
  expect(classifyTurnKind("what is 12+12?")).toBe("conversational");
  expect(classifyTurnKind("what is 13+13? just the number")).toBe(
    "conversational",
  );
});

test("classifyTurnKind marks code tasks as agent", () => {
  expect(classifyTurnKind("implement dark mode in apps/web")).toBe("agent");
  expect(classifyTurnKind("run ls in the repo root and list files")).toBe(
    "agent",
  );
});

test("classifyTurnKind marks MCP and platform tool requests as agent", () => {
  expect(
    classifyTurnKind(
      "can you use eva mcp to run a test query against a project?",
    ),
  ).toBe("agent");
  expect(classifyTurnKind("use the eva mcp to list projects")).toBe("agent");
});

test("classifyTurnKind keeps context-dependent questions on the agent path", () => {
  // A short question that is not a self-contained math/greeting query must run
  // as an agent turn so it keeps the session's context. A conversational turn
  // is stateless (no resume), so it would answer with none of the prior turn's
  // work — see turnKind.ts for why there is no blanket "ends in ?" rule.
  expect(classifyTurnKind("why did you do that?")).toBe("agent");
  expect(classifyTurnKind("can you explain that again?")).toBe("agent");
  expect(classifyTurnKind("is that correct?")).toBe("agent");
});
