import { expect, test } from "vitest";
import { buildEditPrompt } from "../convex/_sessions/prompts";

test("plan mode prepends the ExitPlanMode contract and does not ask to implement", () => {
  const prompt = buildEditPrompt(
    { owner: "vvedantb", name: "eva", baseBranch: "main" },
    "eva/session-1",
    "# Existing\nKeep this",
    "plan the checkout",
    "",
    "",
    undefined,
    undefined,
    [],
    "plan",
  );
  expect(prompt).toContain("You are in plan mode");
  expect(prompt).toContain("ExitPlanMode");
  expect(prompt).toContain("Current plan (revise; do not implement)");
  expect(prompt).not.toContain("Follow this plan when implementing");
});

test("build mode still injects the approved plan as implementation context", () => {
  const prompt = buildEditPrompt(
    { owner: "vvedantb", name: "eva", baseBranch: "main" },
    "eva/session-1",
    "# Existing\nKeep this",
    "ship it",
    "",
    "",
    undefined,
  );
  expect(prompt).toContain("Approved plan:");
  expect(prompt).toContain("Follow this plan when implementing");
  expect(prompt).not.toContain("You are in plan mode");
});
