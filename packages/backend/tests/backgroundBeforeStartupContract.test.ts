import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const sessionsSource = readFileSync(
  join(testsDir, "../convex/_sandbox_runtime/sessions.ts"),
  "utf8",
);

const prepareStepsSource = readFileSync(
  join(testsDir, "../convex/_sandbox_runtime/prepareSandboxSteps.ts"),
  "utf8",
);

function allIndices(source: string, needle: string): number[] {
  const indices: number[] = [];
  let from = 0;
  while (from < source.length) {
    const at = source.indexOf(needle, from);
    if (at < 0) {
      break;
    }
    indices.push(at);
    from = at + needle.length;
  }
  return indices;
}

/**
 * Startup may wait on background daemons (e.g. Convex ready in /tmp/bg-0.log).
 * Paths that still run both must launch background before startup.
 * Task/project resume only runs startup when forceStartupCommands (Retry).
 */
test("sessions.ts runs background before startup for every owner kind", () => {
  for (const owner of [
    "reuseSessionSandbox",
    "newSessionSandbox",
    "reuseTaskSandbox",
    "newTaskSandbox",
    "reuseProjectSandbox",
    "newProjectSandbox",
  ]) {
    const backgroundStep = `"${owner}.runBackgroundCommands"`;
    const startupStep = `"${owner}.runStartupCommands"`;
    const backgroundAts = allIndices(sessionsSource, backgroundStep);
    const startupAts = allIndices(sessionsSource, startupStep);
    expect(
      backgroundAts.length,
      `${owner} missing background step`,
    ).toBeGreaterThan(0);
    expect(startupAts.length, `${owner} missing startup step`).toBeGreaterThan(
      0,
    );
    for (let i = 0; i < startupAts.length; i++) {
      const backgroundBefore = backgroundAts.find((at) => at < startupAts[i]);
      expect(
        backgroundBefore,
        `${owner} startup ${i}: needs a background step before it`,
      ).toBeTypeOf("number");
    }
  }
});

test("prepareSandboxSteps runs background before startup", () => {
  const backgroundAt = prepareStepsSource.indexOf(
    "internal.sandbox.runBackgroundCommands",
  );
  const startupAt = prepareStepsSource.indexOf(
    "internal.sandbox.runStartupCommands",
  );
  expect(backgroundAt).toBeGreaterThan(-1);
  expect(startupAt).toBeGreaterThan(-1);
  expect(backgroundAt).toBeLessThan(startupAt);
});
