import { describe, expect, test } from "vitest";
import {
  exitPlanCaptureKey,
  exitPlanModeDenyResult,
  extractExitPlanModeFromAssistant,
  extractExitPlanModePlan,
} from "../runtime/exitPlanMode.js";

test("extracts the plan field from ExitPlanMode input", () => {
  expect(extractExitPlanModePlan({ plan: "  # Goal\nDo it  " })).toBe(
    "# Goal\nDo it",
  );
  expect(extractExitPlanModePlan({ plan: "   " })).toBeUndefined();
  expect(extractExitPlanModePlan({ text: "nope" })).toBeUndefined();
  expect(extractExitPlanModePlan(null)).toBeUndefined();
});

test("dedupes by tool id when present", () => {
  expect(
    exitPlanCaptureKey({ toolUseId: "toolu_1", planMarkdown: "# A" }),
  ).toBe("tool:toolu_1");
  expect(exitPlanCaptureKey({ planMarkdown: "# A" })).toBe("plan:# A");
});

test("deny message tells the model to wait", () => {
  expect(exitPlanModeDenyResult()).toEqual({
    behavior: "deny",
    message:
      "The client captured your proposed plan. Stop here and wait for the user's feedback or implementation request in a later turn.",
  });
});

test("reads ExitPlanMode blocks off an assistant snapshot", () => {
  const found = extractExitPlanModeFromAssistant({
    type: "assistant",
    message: {
      content: [
        { type: "text", text: "Here's the plan." },
        {
          type: "tool_use",
          name: "ExitPlanMode",
          id: "toolu_plan",
          input: { plan: "# Checkout\nShip it." },
        },
      ],
    },
  });
  expect(found).toEqual([
    { planMarkdown: "# Checkout\nShip it.", toolUseId: "toolu_plan" },
  ]);
});
