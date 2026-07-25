import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const sessionsSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../convex/_sandbox_runtime/sessions.ts",
  ),
  "utf8",
);

/**
 * Session Preview Console launch must stay wired for task/project sandboxes.
 * Frontend auto-type alone races Vercel resume/early-ready (isNewPty false).
 */
test("preview sandbox prep launches the app server for every owner kind", () => {
  for (const step of [
    "reuseSessionSandbox.launchDevServer",
    "newSessionSandbox.launchDevServer",
    "reuseTaskSandbox.launchDevServer",
    "newTaskSandbox.launchDevServer",
    "reuseProjectSandbox.launchDevServer",
    "newProjectSandbox.launchDevServer",
  ]) {
    expect(sessionsSource).toContain(step);
  }
  expect(sessionsSource).toContain("launchPreviewDevServer(");
});
