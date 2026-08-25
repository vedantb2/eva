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

/**
 * On-demand refresh has to work with Eva's setup-tokens. Impersonating Claude
 * Code (User-Agent) is out. Harvesting Messages rate-limit headers is the
 * published-API path that actually returns 5h/weekly windows. A 429 is still
 * its own failure, not "unreachable".
 */
describe("a plan-usage refresh is not mistaken for an unreachable Claude", () => {
  test("refresh tries /usage then Messages, never Claude Code's User-Agent", () => {
    expect(actionSource).toContain("https://api.anthropic.com/api/oauth/usage");
    expect(actionSource).toContain("https://api.anthropic.com/v1/messages");
    expect(actionSource).toContain("Authorization: `Bearer ${token}`");
    expect(actionSource).toContain("requestInferenceUsage");
    expect(actionSource).toContain("claudeUsageBodyFromUnifiedHeaders");
    expect(actionSource).not.toContain("claude-code/");
    expect(actionSource).not.toContain("User-Agent");
    expect(actionSource).not.toContain('from "node:https"');
  });

  test("HTTP 429 is its own failure, not network", () => {
    const fetchAt = actionSource.indexOf("async function fetchClaudeUsage");
    expect(fetchAt, "fetchClaudeUsage moved").toBeGreaterThan(-1);
    expect(actionSource).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
    expect(actionSource).toContain("status === 429");
  });

  test("the toast copy names a rate limit rather than unreachability", () => {
    expect(buttonSource).toContain('"rate-limited":');
    expect(buttonSource).toContain("rate-limited the usage lookup");
    expect(buttonSource).not.toMatch(
      /"rate-limited":\s*"Couldn't reach Claude/,
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
