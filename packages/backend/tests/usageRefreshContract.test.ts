import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(backendDir, "../../apps/web");

const actionSource = readSource(
  join(backendDir, "convex/usageLimitsActions.ts"),
);
const claudeUsageSource = readSource(
  join(backendDir, "convex/_usageLimits/claudeUsage.ts"),
);
const buttonSource = readSource(
  join(webDir, "src/lib/components/usage-limits/UsageRefreshButton.tsx"),
);

/**
 * On-demand refresh is one path: a 1-token Messages call read for its
 * `anthropic-ratelimit-unified-*` headers, sent over `https.request` with the
 * OAuth beta and Claude Code's User-Agent. `/api/oauth/usage` is gone — it 403s
 * every setup-token Eva stores, which is the only credential kind it ever sees.
 * The headers name three windows, so the reading is always merged.
 */
describe("plan-usage refresh is the Messages probe only", () => {
  test("the probe posts to v1/messages with the OAuth beta and Claude Code UA", () => {
    expect(actionSource).toContain('from "node:https"');
    expect(actionSource).toContain("https.request");
    expect(actionSource).toContain("https://api.anthropic.com/v1/messages");
    expect(actionSource).toContain('"anthropic-beta": CLAUDE_USAGE_BETA');
    expect(actionSource).toContain('"User-Agent": CLAUDE_USAGE_USER_AGENT');
    expect(actionSource).toContain("oauth-2025-04-20");
    expect(actionSource).toContain("claude-code/");
    expect(actionSource).toContain("max_tokens: 1");
    expect(actionSource).toContain("USAGE_PROBE_MODELS");
    expect(actionSource).toContain("claudeUsageBodyFromUnifiedHeaders");
    expect(claudeUsageSource).toContain("anthropic-ratelimit-unified");
  });

  test("the OAuth usage endpoint is not called at all", () => {
    // Prod, 24-27 Aug: every `cred=oat` reading 403'd there. Trying it first
    // only bought a wasted request and a misleading "rejected" toast.
    expect(actionSource).not.toContain("api/oauth/usage");
    expect(actionSource).not.toContain("requestOauthUsage");
    expect(actionSource).not.toContain("CLAUDE_USAGE_URL");
  });

  test("a missing model id falls through to the next, not to failure", () => {
    expect(actionSource).toContain("response.status === 404");
    expect(actionSource).toContain("continue");
  });

  test("401/403 is unauthorized and HTTP 429 is its own failure", () => {
    expect(actionSource).toContain(
      "response.status === 401 || response.status === 403",
    );
    expect(actionSource).toContain('kind: "unauthorized"');
    expect(actionSource).toContain("response.status === 429");
    expect(actionSource).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
  });

  test("the reading is always stored partial, never as a snapshot", () => {
    // The probe sees 5h, weekly-all and Fable; a replacing write would delete
    // the Opus/Sonnet weeklies a real turn captured.
    expect(actionSource).toContain('completeness: "partial"');
    expect(actionSource).not.toContain("snapshotComplete");
    expect(actionSource).not.toContain('completeness: "complete"');
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
