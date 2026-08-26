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
 * Two distinct ways `/usage` fails for Eva's stored Claude credential:
 *
 * 1. Without `User-Agent: claude-code/…` Anthropic 429s immediately. Fetch
 *    runtimes may strip that header; `https.request` is what actually sends it.
 * 2. A setup-token (`sk-ant-oat…`, `user:inference`) 403s `/usage` even with
 *    the right UA. A 1-token Messages call still returns 5h/weekly windows on
 *    `anthropic-ratelimit-unified-*`.
 *
 * Neither of those is "Couldn't reach Claude".
 */
describe("a plan-usage refresh is not mistaken for an unreachable Claude", () => {
  test("the request sends the OAuth beta and Claude Code User-Agent over https", () => {
    expect(actionSource).toContain('from "node:https"');
    expect(actionSource).toContain("https.request");
    expect(actionSource).toContain('"anthropic-beta": CLAUDE_USAGE_BETA');
    expect(actionSource).toContain('"User-Agent": CLAUDE_USAGE_USER_AGENT');
    expect(actionSource).toContain("oauth-2025-04-20");
    expect(actionSource).toContain("claude-code/");
  });

  test("HTTP 429 is its own failure, not network", () => {
    const oauthAt = actionSource.indexOf("async function requestOauthUsage");
    expect(oauthAt, "requestOauthUsage moved").toBeGreaterThan(-1);
    const oauthBody = actionSource.slice(oauthAt);
    const limitedAt = oauthBody.indexOf("response.status === 429");
    const otherHttpAt = oauthBody.indexOf("if (!httpOk(response.status))");
    expect(limitedAt, "the 429 branch moved").toBeGreaterThan(-1);
    expect(otherHttpAt, "the catch-all HTTP branch moved").toBeGreaterThan(
      limitedAt,
    );
    expect(oauthBody).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
  });

  test("a setup-token 403 still probes Messages unified headers", () => {
    expect(actionSource).toContain("https://api.anthropic.com/v1/messages");
    expect(actionSource).toContain("requestInferenceUsage");
    expect(actionSource).toContain("claudeUsageBodyFromUnifiedHeaders");
    const fetchAt = actionSource.indexOf("async function fetchClaudeUsage");
    expect(fetchAt, "fetchClaudeUsage moved").toBeGreaterThan(-1);
    const fetchBody = actionSource.slice(fetchAt);
    expect(fetchBody).toContain("requestOauthUsage");
    expect(fetchBody).toContain("requestInferenceUsage");
    expect(fetchBody.indexOf("requestInferenceUsage")).toBeGreaterThan(
      fetchBody.indexOf("requestOauthUsage"),
    );
  });

  test("a Messages-header probe merges so model-scoped windows survive", () => {
    expect(actionSource).toContain("authoritative: false");
    expect(actionSource).toContain('authoritative: true');
    expect(actionSource).toContain(
      'const completeness = result.authoritative ? "complete" : "partial"',
    );
    expect(actionSource).toContain("snapshotComplete: result.authoritative");
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
