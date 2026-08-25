import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(backendDir, "../../apps/web");

const actionSource = readSource(
  join(backendDir, "convex/usageLimitsActions.ts"),
);
const buttonSource = readSource(
  join(webDir, "src/lib/components/usage-limits/UsageRefreshButton.tsx"),
);
const daemonSource = readSource(
  join(backendDir, "callback-src/providers/claudeSdkDaemon.ts"),
);

/**
 * On-demand refresh has to work with Eva's setup-tokens without Eva's servers
 * calling Messages (the OpenCode-shaped path) or impersonating Claude Code.
 * The live Agent SDK daemon reports; a stopped sandbox must not be woken.
 */
describe("a plan-usage refresh is not a third-party Messages probe", () => {
  test("refresh never calls Anthropic HTTP from Convex, never Claude Code's User-Agent", () => {
    expect(actionSource).not.toContain("api.anthropic.com");
    expect(actionSource).not.toContain("v1/messages");
    expect(actionSource).not.toContain("requestInferenceUsage");
    expect(actionSource).not.toContain("claude-code/");
    expect(actionSource).not.toContain("User-Agent");
    expect(actionSource).not.toContain('from "node:https"');
    expect(actionSource).toContain("requestRefresh");
    expect(actionSource).toContain("clearRefresh");
    expect(actionSource).toContain("prewarmDaemonNow");
    expect(actionSource).toContain("sandbox-idle");
  });

  test("the live Claude daemon reports on the level-triggered flag", () => {
    expect(daemonSource).toContain("readUsageRefreshRequested");
    expect(daemonSource).toContain("force: true");
    expect(daemonSource).toContain("captureAndReportClaudeUsage");
    expect(daemonSource).not.toContain("usageLimits:clearRefresh");
    expect(daemonSource).not.toContain("startClaudeUsageReport");
    const claim = readSource(
      join(backendDir, "convex/_sessions/workflow.ts"),
    );
    expect(claim).toContain("usageRefreshRequested");
    expect(claim).not.toContain("usageRefreshRequestedAt: undefined");
  });

  test("a stopped sandbox is an informational toast, not a red error", () => {
    expect(buttonSource).toContain('"sandbox-idle":');
    expect(buttonSource).toContain("Wake Eva to refresh plan usage.");
    expect(buttonSource).toMatch(
      /if \(result\.reason === "sandbox-idle"\) \{\s*toast\(copy\);/,
    );
  });

  test("the card still has a refresh control", () => {
    const details = readSource(
      join(webDir, "src/lib/components/usage-limits/UsageLimitsDetails.tsx"),
    );
    expect(details).toContain("UsageRefreshButton");
    expect(buttonSource).toContain("usageLimitsActions.refresh");
  });
});

function readSource(path: string): string {
  return stripComments(readFileSync(path, "utf8").replaceAll("\r\n", "\n"));
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
