import { expect, test } from "vitest";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import {
  resolveNewTaskBaseBranch,
  resolveTaskWorkflowBaseBranch,
} from "../convex/_taskWorkflow/resolveBaseBranch";

test("resolveTaskWorkflowBaseBranch prefers project base when task is in a project", () => {
  // Child tasks must inherit the project's base, not drift to the repo default.
  expect(
    resolveTaskWorkflowBaseBranch(
      { baseBranch: "task-branch", projectId: "proj1" },
      { defaultBaseBranch: "main" },
      { baseBranch: "release/carepulse" },
    ),
  ).toBe("release/carepulse");
});

test("resolveTaskWorkflowBaseBranch uses task then repo when not in a project", () => {
  expect(
    resolveTaskWorkflowBaseBranch(
      { baseBranch: "feature/x", projectId: undefined },
      { defaultBaseBranch: "main" },
      { baseBranch: "ignored-project" },
    ),
  ).toBe("feature/x");

  expect(
    resolveTaskWorkflowBaseBranch(
      { baseBranch: "  ", projectId: undefined },
      { defaultBaseBranch: "develop" },
    ),
  ).toBe("develop");
});

test("resolveTaskWorkflowBaseBranch falls back when all candidates empty", () => {
  expect(
    resolveTaskWorkflowBaseBranch(
      { baseBranch: undefined, projectId: undefined },
      null,
    ),
  ).toBe(FALLBACK_GIT_BASE_BRANCH);
});

test("resolveNewTaskBaseBranch prefers explicit then project then repo", () => {
  expect(
    resolveNewTaskBaseBranch(
      "explicit",
      { defaultBaseBranch: "main" },
      { baseBranch: "project" },
    ),
  ).toBe("explicit");
  expect(
    resolveNewTaskBaseBranch(
      undefined,
      { defaultBaseBranch: "main" },
      { baseBranch: "project" },
    ),
  ).toBe("project");
  expect(
    resolveNewTaskBaseBranch(undefined, { defaultBaseBranch: "main" }),
  ).toBe("main");
});
