import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const sessionsSource = readFileSync(
  join(testsDir, "../convex/_daytona/sessions.ts"),
  "utf8",
);

const prepareStepsSource = readFileSync(
  join(testsDir, "../convex/_daytona/prepareSandboxSteps.ts"),
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
 * Every sandbox owner path must launch background before startup.
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
    expect(startupAts.length, `${owner} missing startup step`).toBe(
      backgroundAts.length,
    );
    for (let i = 0; i < startupAts.length; i++) {
      expect(
        backgroundAts[i],
        `${owner} pair ${i}: background must appear before startup`,
      ).toBeLessThan(startupAts[i]);
    }
  }
});

test("prepareSandboxSteps runs background before startup", () => {
  const backgroundAt = prepareStepsSource.indexOf(
    "internal.daytona.runBackgroundCommands",
  );
  const startupAt = prepareStepsSource.indexOf(
    "internal.daytona.runStartupCommands",
  );
  expect(backgroundAt).toBeGreaterThan(-1);
  expect(startupAt).toBeGreaterThan(-1);
  expect(backgroundAt).toBeLessThan(startupAt);
});
