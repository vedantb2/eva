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

test("chat re-staging keeps Codex turns instead of dropping them as non-claude", () => {
  // ensurePendingTurn re-stages a prompt when cancel raced startExecute. A
  // claude-only guard silently dropped that prompt on codex chats; the daemon
  // discards mid-turn claims now, so the guard matches the workflow's.
  for (const daemon of [
    "convex/_chat/taskChatDaemon.ts",
    "convex/_chat/projectChatDaemon.ts",
  ]) {
    const body = source(daemon);
    expect(body).toContain("!usesChatDaemon(normalizeAIModel(args.model))");
    expect(body).not.toContain('!== "claude"');
  }
});

test("non-chat Codex jobs route through the official SDK without a direct exec path", () => {
  const callbackEntry = source("callback-src/index.ts");
  expect(callbackEntry).toContain(
    "const firstAttempt = await runProviderAttempt(initialSessionMode)",
  );
  const attempts = source("callback-src/providers/attempts.ts");
  expect(attempts).toContain(
    'import { runCodexSdkAttempt } from "./codexSdk.js"',
  );
  expect(attempts).toContain("return await runCodexSdkAttempt(sessionMode)");

  const sdkRunner = source("callback-src/providers/codexSdk.ts");
  expect(sdkRunner).toContain(
    'import { Codex, type ThreadEvent, type ThreadOptions } from "@openai/codex-sdk"',
  );
  expect(sdkRunner).toContain("await thread.runStreamed(");

  const config = source("callback-src/config.ts");
  expect(config).not.toContain("codexExecBaseCmd");
  expect(config).not.toContain("codexPromptCmd");
  expect(attempts).not.toContain("codexExecBaseCmd");
  expect(attempts).not.toContain("codexPromptCmd");
  expect(source("package.json")).toContain('"@openai/codex-sdk"');

  const deployedCallback = source(
    "convex/_sandbox_runtime/callbackScript.generated.ts",
  );
  expect(deployedCallback).toContain("runCodexSdkAttempt");
  expect(deployedCallback).toContain('"codex_sdk_ts"');
  expect(deployedCallback).not.toContain("codexExecBaseCmd");
  expect(deployedCallback).not.toContain("codexPromptCmd");
});
