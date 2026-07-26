import { expect, test } from "vitest";
import { buildEditPrompt } from "../convex/_sessions/prompts";
import {
  buildProofPrompt,
  buildProofRetryPrompt,
} from "../convex/_taskWorkflow/prompts";

/**
 * `agent-browser record` resolves a relative path against the agent-browser
 * daemon's cwd, not the shell's, so the .webm lands where Eva never looks for
 * it and the run reports no proof. Every prompt that asks for a recording must
 * spell out an absolute path.
 */
const RECORD_START = "agent-browser record start /tmp/repo/recordings/";

function editPromptWithProof(): string {
  return buildEditPrompt(
    { owner: "vvedantb", name: "eva", baseBranch: "main" },
    "eva/some-branch",
    "",
    "make the save button obvious when dirty",
    "apps/web",
    "",
    undefined,
    true,
  );
}

test("the session edit prompt records to an absolute path", () => {
  const prompt = editPromptWithProof();
  expect(prompt).toContain(RECORD_START);
  expect(prompt).toMatch(/ALWAYS.*absolute paths/i);
  // A bare `record start proof.webm` is the bug this guards.
  expect(prompt).not.toMatch(/record start (?!\/)[\w<]/);
});

test("the task proof prompts record to an absolute path", () => {
  const proof = buildProofPrompt(
    { title: "Highlight the save button", description: "" },
    "apps/web",
    "- Save control looks different when dirty",
    undefined,
    { devPort: 4173, devCommand: "pnpm run dev" },
  );
  const retry = buildProofRetryPrompt(
    { title: "Highlight the save button", description: "" },
    "apps/web",
    { devPort: 4173, devCommand: "pnpm run dev" },
  );
  for (const prompt of [proof, retry]) {
    expect(prompt).toMatch(/\/tmp\/repo\/recordings/);
    expect(prompt).not.toMatch(/record start (?!\/)[\w<]/);
  }
});

/**
 * ffmpeg writes the WebM progressively, so a missing or 0-byte file a few
 * seconds in means recording cannot succeed at all (usually ffmpeg absent).
 * Without this check the agent retry-loops on a capture that will never work
 * instead of falling back to screenshots.
 */
test("recording prompts tell the agent to verify the file is growing", () => {
  const prompts = [
    editPromptWithProof(),
    buildProofPrompt(
      { title: "Highlight the save button", description: "" },
      "apps/web",
      "- Save control looks different when dirty",
      undefined,
      { devPort: 4173, devCommand: "pnpm run dev" },
    ),
  ];
  for (const prompt of prompts) {
    expect(prompt).toMatch(/ls -la \/tmp\/repo\/recordings/);
    expect(prompt).toMatch(/0-byte/);
    expect(prompt).toMatch(/screenshot/i);
  }
});
