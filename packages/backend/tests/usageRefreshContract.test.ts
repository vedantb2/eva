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
 * On-demand refresh reads `GET /api/oauth/usage` first, with Claude Code's
 * User-Agent over `https.request`, and falls back to a 1-token Messages probe
 * when the stored credential lacks `user:profile`. The probe's headers name only
 * 5h, weekly-all and Fable, so its reading must be merged rather than replace
 * the row.
 */
describe("plan-usage refresh reads /api/oauth/usage then probes Messages", () => {
  test("the request sends the OAuth beta and Claude Code User-Agent over https", () => {
    expect(actionSource).toContain('from "node:https"');
    expect(actionSource).toContain("https.request");
    expect(actionSource).toContain('"anthropic-beta": CLAUDE_USAGE_BETA');
    expect(actionSource).toContain('"User-Agent": CLAUDE_USAGE_USER_AGENT');
    expect(actionSource).toContain("oauth-2025-04-20");
    expect(actionSource).toContain("claude-code/");
    expect(actionSource).toContain("https://api.anthropic.com/api/oauth/usage");
  });

  test("/usage is tried before the probe", () => {
    const usageAt = actionSource.indexOf("requestOauthUsage(token)");
    const probeAt = actionSource.indexOf("requestInferenceUsage(token)");
    expect(usageAt).toBeGreaterThan(-1);
    expect(probeAt).toBeGreaterThan(usageAt);
  });

  test("the Messages probe fallback reads the unified rate-limit headers", () => {
    expect(actionSource).toContain("https://api.anthropic.com/v1/messages");
    expect(actionSource).toContain("requestInferenceUsage");
    expect(actionSource).toContain("USAGE_PROBE_MODELS");
    expect(actionSource).toContain("claudeUsageBodyFromUnifiedHeaders");
    expect(actionSource).toContain("max_tokens: 1");
    expect(claudeUsageSource).toContain("anthropic-ratelimit-unified");
  });

  test("HTTP 429 is its own failure, not network", () => {
    expect(actionSource).toContain("response.status === 429");
    expect(actionSource).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
  });

  test("a probe reading is stored partial; only /usage replaces the row", () => {
    // Replacing on a probe reading would delete the Opus/Sonnet weeklies a real
    // turn captured, because the headers name 5h, weekly-all and Fable alone.
    expect(actionSource).toContain(
      'completeness: authoritative ? "complete" : "partial"',
    );
    expect(actionSource).toContain('result.source === "oauth-usage"');
    expect(actionSource).toContain(
      "...(authoritative ? { snapshotComplete: true } : {})",
    );
    // Unconditional completeness or snapshotComplete would store the probe's
    // two windows as the whole picture.
    expect(actionSource).not.toMatch(/^\s*snapshotComplete: true,\s*$/m);
    expect(actionSource).not.toMatch(/^\s*completeness: "complete",\s*$/m);
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
