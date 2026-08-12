import { readFileSync } from "fs";
import { join } from "path";
import { expect, test } from "vitest";

const backendRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(backendRoot, path), "utf8");
}

test("interactive Codex surfaces route through the persistent App Server daemon", () => {
  const callbackEntry = source("callback-src/index.ts");
  expect(callbackEntry).toContain('if (PROVIDER === "codex")');
  expect(callbackEntry).toContain("await runCodexAppServerDaemon()");

  for (const workflow of [
    "convex/_sessions/workflow.ts",
    "convex/agentTaskChatWorkflow.ts",
    "convex/projectChatWorkflow.ts",
  ]) {
    expect(source(workflow)).toContain("if (usesChatDaemon(data.model))");
  }

  expect(source("convex/_sandbox_runtime/execution.ts")).toContain(
    "if (!usesChatDaemon(normalizedModel))",
  );
});

test("one-shot provider attempts remain available for non-chat Codex jobs", () => {
  const callbackEntry = source("callback-src/index.ts");
  expect(callbackEntry).toContain(
    "const firstAttempt = await runProviderAttempt(initialSessionMode)",
  );
  expect(source("callback-src/providers/attempts.ts")).toContain(
    'if (PROVIDER === "codex") return await runCodexAttempt(sessionMode)',
  );
});
