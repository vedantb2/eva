import { describe, expect, test } from "vitest";
import {
  buildPlanImplementationPrompt,
  proposedPlanTitle,
  resolvePlanFollowUpSubmission,
} from "./planExport";
import { parseComposerModeSlash } from "@/lib/components/chat/planMode";
import {
  findLatestProposedPlan,
  hasActionableProposedPlan,
  shouldShowPlanFollowUpPrompt,
  type ProposedPlanRow,
} from "./proposedPlanLogic";
import type { Id } from "@eva/backend";

test("empty follow-up implements and leaves plan mode", () => {
  expect(
    resolvePlanFollowUpSubmission({
      draftText: "",
      planMarkdown: "# Checkout\nDo the work.",
    }),
  ).toEqual({
    text: "PLEASE IMPLEMENT THIS PLAN:\n# Checkout\nDo the work.",
    interactionMode: "default",
  });
});

test("typed follow-up stays in plan mode", () => {
  expect(
    resolvePlanFollowUpSubmission({
      draftText: "Also cover mobile",
      planMarkdown: "# Checkout\nDo the work.",
    }),
  ).toEqual({
    text: "Also cover mobile",
    interactionMode: "plan",
  });
});

test("slash commands toggle mode", () => {
  expect(parseComposerModeSlash("/plan")).toBe("plan");
  expect(parseComposerModeSlash(" /build ")).toBe("default");
  expect(parseComposerModeSlash("/default")).toBe("default");
  expect(parseComposerModeSlash("/plan please")).toBeNull();
});

test("proposed plan title is the first heading", () => {
  expect(proposedPlanTitle("# Checkout rework\n\nSteps")).toBe(
    "Checkout rework",
  );
  expect(proposedPlanTitle("no heading")).toBeNull();
});

test("buildPlanImplementationPrompt prefixes the plan", () => {
  expect(buildPlanImplementationPrompt("  # A\nB  ")).toBe(
    "PLEASE IMPLEMENT THIS PLAN:\n# A\nB",
  );
});

describe("proposed plan selection", () => {
  const older: ProposedPlanRow = {
    _id: "plan_old" as Id<"proposedPlans">,
    planMarkdown: "# Old",
    createdAt: 1,
    updatedAt: 1,
  };
  const newer: ProposedPlanRow = {
    _id: "plan_new" as Id<"proposedPlans">,
    planMarkdown: "# New",
    createdAt: 2,
    updatedAt: 3,
  };

  test("picks the most recently updated plan", () => {
    expect(findLatestProposedPlan([older, newer])?._id).toBe("plan_new");
  });

  test("actionable means not yet implemented", () => {
    expect(hasActionableProposedPlan(newer)).toBe(true);
    expect(
      hasActionableProposedPlan({ ...newer, implementedAt: 9 }),
    ).toBe(false);
    expect(hasActionableProposedPlan(null)).toBe(false);
  });

  test("follow-up banner only in settled plan mode with an open plan", () => {
    expect(
      shouldShowPlanFollowUpPrompt({
        pendingUserInputCount: 0,
        interactionMode: "plan",
        latestTurnSettled: true,
        hasActionableProposedPlan: true,
        hasComposerAttachments: false,
      }),
    ).toBe(true);
    expect(
      shouldShowPlanFollowUpPrompt({
        pendingUserInputCount: 0,
        interactionMode: "default",
        latestTurnSettled: true,
        hasActionableProposedPlan: true,
        hasComposerAttachments: false,
      }),
    ).toBe(false);
  });
});
