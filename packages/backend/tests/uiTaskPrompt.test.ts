import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isUiImplementationTask,
  UI_TASK_DESCRIPTION_TEMPLATE,
} from "@conductor/shared/uiTaskPrompt";
import {
  buildImplementationSteps,
  buildSummarySection,
  buildUiProofCaptureHint,
  detectUiImplementationTask,
} from "../convex/_taskWorkflow/uiImplementationPrompt";

describe("isUiImplementationTask", () => {
  it("detects UI keywords in title", () => {
    assert.equal(
      isUiImplementationTask({
        title:
          "on users may page, dropdown scrollbar always visible for user type",
      }),
      true,
    );
  });

  it("detects structured UI description sections", () => {
    assert.equal(
      isUiImplementationTask({
        title: "Fix thing",
        description: "## Route\n/domcare/users-may",
      }),
      true,
    );
  });

  it("returns false for backend-only tasks", () => {
    assert.equal(
      isUiImplementationTask({
        title: "Add cron job to purge stale sessions",
        description: "Run nightly in convex/crons.ts",
      }),
      false,
    );
  });
});

describe("ui implementation prompt sections", () => {
  const typecheck = "cd /tmp/repo && npx tsc";
  const commit = "feat: test";
  const branch = "eva/project-1";

  it("includes locate-the-UI step for UI tasks", () => {
    const steps = buildImplementationSteps(typecheck, commit, branch, true);
    assert.match(steps, /Locate the UI \(required before editing\)/);
    assert.match(steps, /Do NOT change unrelated Selects\/dropdowns/);
  });

  it("omits UI locate step for backend tasks", () => {
    const steps = buildImplementationSteps(typecheck, commit, branch, false);
    assert.doesNotMatch(steps, /Locate the UI \(required before editing\)/);
  });

  it("uses UI summary rules when task looks like UI work", () => {
    const uiTask = detectUiImplementationTask({
      title: "Profile type filter scrollbar on users-may list",
    });
    assert.equal(uiTask, true);
    const summary = buildSummarySection(uiTask);
    assert.match(summary, /route and the specific control you changed/);
    assert.match(summary, /Do NOT claim "No user-facing routes changed"/);
  });

  it("uses default summary rules for backend tasks", () => {
    const uiTask = detectUiImplementationTask({
      title: "Migrate webhook handler to new schema",
    });
    assert.equal(uiTask, false);
    const summary = buildSummarySection(uiTask);
    assert.match(summary, /No user-facing routes changed/);
    assert.doesNotMatch(summary, /specific control you changed/);
  });

  it("adds UI proof hint when description uses the template", () => {
    const uiTask = detectUiImplementationTask({
      title: "Minor tweak",
      description: UI_TASK_DESCRIPTION_TEMPLATE,
    });
    assert.equal(uiTask, true);
    assert.match(buildUiProofCaptureHint(uiTask), /exact control/);
  });
});
