import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  READ_ONLY_DELIVERABLE_MARKER,
  extractReadOnlyDeliverable,
} from "../convex/_automationWorkflow/deliverable";
import { buildReadOnlyPrompt } from "../convex/_automationWorkflow/prompts";

describe("extractReadOnlyDeliverable", () => {
  it("returns text after the deliverable marker", () => {
    const input = `Today is Monday. Let me read the file.

${READ_ONLY_DELIVERABLE_MARKER}

✨ **New Features**
- Something users can do now.`;

    assert.equal(
      extractReadOnlyDeliverable(input),
      "✨ **New Features**\n- Something users can do now.",
    );
  });

  it("strips a horizontal rule immediately after the marker", () => {
    const input = `${READ_ONLY_DELIVERABLE_MARKER}
---

## Summary
- One change`;

    assert.equal(extractReadOnlyDeliverable(input), "## Summary\n- One change");
  });

  it("falls back to full text when the marker is missing", () => {
    const input = "No marker — legacy output.";
    assert.equal(extractReadOnlyDeliverable(input), input);
  });

  it("returns empty string for empty input", () => {
    assert.equal(extractReadOnlyDeliverable(""), "");
    assert.equal(extractReadOnlyDeliverable("   \n  "), "");
  });
});

describe("buildReadOnlyPrompt", () => {
  it("includes the deliverable marker and no-preamble rules", () => {
    const prompt = buildReadOnlyPrompt("Weekly report", "List open bugs.", "");
    assert.match(prompt, new RegExp(READ_ONLY_DELIVERABLE_MARKER));
    assert.match(prompt, /No preamble/);
    assert.doesNotMatch(
      prompt,
      /detailed report\/analysis as your final output/,
    );
  });
});
