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
 * On-demand refresh is a Bearer GET to `/api/oauth/usage`. Impersonating
 * Claude Code (User-Agent) or harvesting Messages rate-limit headers is how
 * we got a reading out of a setup-token — and is also how we do not want to
 * talk to Anthropic. A 429 is still its own failure, not "unreachable".
 */
describe("a plan-usage refresh is not mistaken for an unreachable Claude", () => {
  test("the request is a Bearer GET to /usage, not Claude Code or Messages", () => {
    expect(actionSource).toContain("https://api.anthropic.com/api/oauth/usage");
    expect(actionSource).toContain("Authorization: `Bearer ${token}`");
    expect(actionSource).not.toContain("claude-code/");
    expect(actionSource).not.toContain("User-Agent");
    expect(actionSource).not.toContain("v1/messages");
    expect(actionSource).not.toContain("from \"node:https\"");
    expect(actionSource).not.toContain("requestInferenceUsage");
    expect(actionSource).not.toContain("claudeUsageBodyFromUnifiedHeaders");
  });

  test("HTTP 429 is its own failure, not network", () => {
    const fetchAt = actionSource.indexOf("async function fetchClaudeUsage");
    expect(fetchAt, "fetchClaudeUsage moved").toBeGreaterThan(-1);
    const fetchBody = actionSource.slice(fetchAt);
    const limitedAt = fetchBody.indexOf("response.status === 429");
    const networkAt = fetchBody.indexOf("if (!response.ok)");
    expect(limitedAt, "the 429 branch moved").toBeGreaterThan(-1);
    expect(networkAt, "the catch-all HTTP branch moved").toBeGreaterThan(
      limitedAt,
    );
    expect(fetchBody).toContain('kind: "rate-limited"');
    expect(actionSource).toContain('reason: "rate-limited"');
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
