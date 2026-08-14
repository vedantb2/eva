import { expect, test } from "vitest";
import {
  inProgressWhenChatStarts,
  todoWhenChatEnds,
} from "../convex/_agentTasks/helpers";

test("a todo task becomes in_progress when the agent starts chatting", () => {
  expect(inProgressWhenChatStarts("todo")).toBe("in_progress");
});

test("review and terminal statuses stay put when chat starts", () => {
  expect(inProgressWhenChatStarts("in_progress")).toBeUndefined();
  expect(inProgressWhenChatStarts("business_review")).toBeUndefined();
  expect(inProgressWhenChatStarts("code_review")).toBeUndefined();
  expect(inProgressWhenChatStarts("done")).toBeUndefined();
  expect(inProgressWhenChatStarts("cancelled")).toBeUndefined();
  expect(inProgressWhenChatStarts("draft")).toBeUndefined();
});

test("chat end restores todo unless a main run is still going", () => {
  expect(
    todoWhenChatEnds({ status: "in_progress", hasActiveRun: false }),
  ).toBe("todo");
  expect(
    todoWhenChatEnds({
      status: "in_progress",
      activeWorkflowId: "wf",
      hasActiveRun: false,
    }),
  ).toBeUndefined();
  expect(
    todoWhenChatEnds({ status: "in_progress", hasActiveRun: true }),
  ).toBeUndefined();
  expect(
    todoWhenChatEnds({ status: "business_review", hasActiveRun: false }),
  ).toBeUndefined();
});
