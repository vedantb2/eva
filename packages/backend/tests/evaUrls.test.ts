import { afterEach, beforeEach, expect, test } from "vitest";
import {
  buildEvaDocUrl,
  buildEvaProjectUrl,
  buildEvaSessionUrl,
  buildEvaTaskUrl,
} from "../convex/_taskWorkflow/urls";

const PREV_WEB_APP_URL = process.env.WEB_APP_URL;

beforeEach(() => {
  process.env.WEB_APP_URL = "https://eva.example.com/";
});

afterEach(() => {
  if (PREV_WEB_APP_URL === undefined) {
    delete process.env.WEB_APP_URL;
  } else {
    process.env.WEB_APP_URL = PREV_WEB_APP_URL;
  }
});

test("buildEvaDocUrl uses numeric doc id and monorepo app segment", () => {
  // GitHub Eva links must use numId paths, not Convex document ids.
  expect(
    buildEvaDocUrl("evalucom", "carepulse-ts", 42, "content", "apps/web"),
  ).toBe("https://eva.example.com/evalucom/carepulse-ts--web/docs/42/content");
});

test("buildEvaTaskUrl routes project tasks to project URL", () => {
  expect(
    buildEvaTaskUrl(
      "evalucom",
      "carepulse-ts",
      "task_1",
      "proj_1",
      "apps/eprocurement",
    ),
  ).toBe(
    "https://eva.example.com/evalucom/carepulse-ts--eprocurement/projects/proj_1",
  );
});

test("buildEvaTaskUrl uses quick-tasks path without project", () => {
  expect(buildEvaTaskUrl("vvedantb", "eva", "task_9")).toBe(
    "https://eva.example.com/vvedantb/eva/quick-tasks/task_9",
  );
});

test("buildEvaSessionUrl and buildEvaProjectUrl include app segment when set", () => {
  expect(buildEvaSessionUrl("vvedantb", "eva", "sess_1", "apps/web")).toBe(
    "https://eva.example.com/vvedantb/eva--web/sessions/sess_1",
  );
  expect(buildEvaProjectUrl("vvedantb", "eva", "proj_2", "apps/web")).toBe(
    "https://eva.example.com/vvedantb/eva--web/projects/proj_2",
  );
});
