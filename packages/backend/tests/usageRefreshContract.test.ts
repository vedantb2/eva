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
 * `GET /api/oauth/usage` 429s a Node/undici User-Agent immediately. The toast
 * then said "Couldn't reach Claude" because every non-401 failure was labelled
 * `network`. The request has to look like Claude Code's, and a real 429 has to
 * stay a 429.
 */
describe("a plan-usage refresh is not mistaken for an unreachable Claude", () => {
  test("the request sends the OAuth beta and Claude Code User-Agent", () => {
    expect(actionSource).toContain('"anthropic-beta": CLAUDE_USAGE_BETA');
    expect(actionSource).toContain('"User-Agent": CLAUDE_USAGE_USER_AGENT');
    expect(actionSource).toContain('oauth-2025-04-20');
    expect(actionSource).toContain("claude-code/");
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
  return stripComments(
    readFileSync(path, "utf8").replaceAll("\r\n", "\n"),
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
