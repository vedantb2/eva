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
 * On-demand refresh is only `GET /api/oauth/usage` with Claude Code's
 * User-Agent over `https.request`. No Messages probe, no setup-token header
 * harvest ? those were the OpenCode-shaped third-party path.
 */
describe("plan-usage refresh uses only /api/oauth/usage", () => {
  test("the request sends the OAuth beta and Claude Code User-Agent over https", () => {
    expect(actionSource).toContain('from "node:https"');
    expect(actionSource).toContain("https.request");
    expect(actionSource).toContain('"anthropic-beta": CLAUDE_USAGE_BETA');
    expect(actionSource).toContain('"User-Agent": CLAUDE_USAGE_USER_AGENT');
    expect(actionSource).toContain("oauth-2025-04-20");
    expect(actionSource).toContain("claude-code/");
    expect(actionSource).toContain("https://api.anthropic.com/api/oauth/usage");
  });

  test("there is no Messages probe or setup-token fallback", () => {
    expect(actionSource).not.toContain("v1/messages");
    expect(actionSource).not.toContain("requestInferenceUsage");
    expect(actionSource).not.toContain("USAGE_PROBE");
    expect(actionSource).not.toContain("claudeUsageBodyFromUnifiedHeaders");
    expect(actionSource).not.toContain("anthropic-ratelimit-unified");
  });

  test("HTTP 429 is its own failure, not network", () => {
    expect(actionSource).toContain("response.status === 429");
    expect(actionSource).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
  });

  test("a successful /usage read is stored as a complete snapshot", () => {
    expect(actionSource).toContain('completeness: "complete"');
    expect(actionSource).toContain("snapshotComplete: true");
  });

  test("the toast copy names a rate limit rather than unreachability", () => {
    expect(buttonSource).toContain('"rate-limited":');
    expect(buttonSource).toContain("rate-limited the usage lookup");
    expect(buttonSource).not.toMatch(
      /"rate-limited":\s*"Couldn't reach Claude/,
    );
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
