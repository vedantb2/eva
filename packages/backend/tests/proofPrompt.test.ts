import { expect, test } from "vitest";
import {
  buildProofPrompt,
  buildProofRetryPrompt,
} from "../convex/_taskWorkflow/prompts";

test("buildProofPrompt uses repo dev port/command and requires diff review", () => {
  const prompt = buildProofPrompt(
    {
      title: "Highlight the save button when dirty",
      description: "Show a distinct style on the settings save control",
    },
    "apps/web",
    "- Settings save control looks different when there are unsaved edits",
    undefined,
    { devPort: 4173, devCommand: "pnpm run dev" },
  );

  expect(prompt).toContain("http://localhost:4173");
  expect(prompt).toContain("pnpm run dev");
  expect(prompt).toContain("/tmp/repo/recordings");
  expect(prompt).toContain("/tmp/repo/screenshots");
  expect(prompt).toContain("git show --stat HEAD");
  expect(prompt).toMatch(/Review the diff/i);
  expect(prompt).toMatch(/Verify against the diff/i);
  expect(prompt).toContain("agent-browser record start /tmp/repo/recordings/proof.webm");
  expect(prompt).toContain("Do NOT edit source files");
  expect(prompt).not.toContain("--annotate");
  expect(prompt).not.toMatch(/screenshot the error state with.*anyway/i);
});

test("buildProofRetryPrompt requires a media file under /tmp/repo", () => {
  const prompt = buildProofRetryPrompt(
    { title: "Highlight the save button when dirty" },
    "apps/web",
    { devPort: 4173, devCommand: "pnpm run dev" },
  );

  expect(prompt).toMatch(/PROOF CAPTURE RETRY MODE/);
  expect(prompt).toContain("git show --stat HEAD");
  expect(prompt).toContain("/tmp/repo/screenshots/proof.png");
  expect(prompt).toContain("Do NOT exit without a media file");
});
