import { expect, test } from "vitest";
import { buildProofPrompt } from "../convex/_taskWorkflow/prompts";

test("buildProofPrompt defaults to video walkthrough and forbids code edits", () => {
  const prompt = buildProofPrompt(
    { title: "Dark mode toggle", description: "Theme switch" },
    "apps/web",
    "Added theme toggle in header",
  );

  expect(prompt).toContain("## Steps (default: video):");
  expect(prompt).toContain("agent-browser record start recordings/proof.webm");
  expect(prompt).toContain("Do NOT edit source files");
  expect(prompt).toContain("Added theme toggle in header");
  expect(prompt).not.toContain("--annotate");
});
