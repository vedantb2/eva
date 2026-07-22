import { test, expect } from "vitest";
import { mergeBackgroundAgents } from "../convex/_sessions/backgroundAgents";
import { readStopTaskToolUseIds } from "../callback-src/providers/claimPendingTurnParse";

test("mergeBackgroundAgents upserts by toolUseId", () => {
  const merged = mergeBackgroundAgents(
    [
      {
        toolUseId: "tool-a",
        status: "running",
        startedAt: 100,
      },
    ],
    [
      {
        toolUseId: "tool-a",
        status: "completed",
        startedAt: 100,
        settledAt: 200,
      },
      {
        toolUseId: "tool-b",
        status: "running",
        startedAt: 150,
        description: "Find data model",
      },
    ],
  );

  expect(merged).toHaveLength(2);
  expect(merged.find((entry) => entry.toolUseId === "tool-a")).toMatchObject({
    status: "completed",
    settledAt: 200,
  });
  expect(merged.find((entry) => entry.toolUseId === "tool-b")).toMatchObject({
    description: "Find data model",
    status: "running",
  });
});

test("readStopTaskToolUseIds unwraps Convex HTTP envelope", () => {
  expect(
    readStopTaskToolUseIds({
      status: "success",
      value: {
        prompt: null,
        turnKind: "agent",
        attachmentUrls: [],
        stopTaskToolUseIds: ["tool-1", "tool-2"],
      },
    }),
  ).toEqual(["tool-1", "tool-2"]);

  expect(
    readStopTaskToolUseIds({
      prompt: null,
      stopTaskToolUseIds: ["tool-3"],
    }),
  ).toEqual(["tool-3"]);
});
