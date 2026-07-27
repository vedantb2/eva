import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

/**
 * Convex caches query results and invalidates them on data dependencies, never on
 * wall-clock time. A query that reads the clock therefore keeps serving whatever
 * the clock said when the result was first computed: `mcp.oauth.getClient` kept
 * an expired OAuth registration alive past its 24h TTL that way (fix 7c49da26,
 * found by convex-doctor). The fix is always the same — take `now` as an arg, so
 * the clock is read in the mutation or action that can safely read it.
 *
 * Nothing in the type system or the test suite catches this: the query compiles,
 * runs, and returns a plausible answer.
 */
const FORBIDDEN = ["Date.now()", "Math.random()", "new Date()"];

/**
 * Queries that still read the clock. This list may shrink, never grow — a new
 * entry means a new cache-staleness bug shipped.
 *
 * All six are time-window reads whose fix needs `now` threaded from the web
 * caller, so they are recorded rather than silently tolerated.
 */
const KNOWN_OFFENDERS = [
  "analytics.ts|getImpactStats",
  "analytics.ts|getActiveUsers",
  "analytics.ts|getActivityTimeline",
  "analytics.ts|getActivityHeatmap",
  "users.ts|listOnlineTeammates",
  "users.ts|listTeamWithMembers",
];

describe("Convex queries are deterministic", () => {
  const offenders = findClockReadingQueries();

  test("no query reads the clock beyond the known list", () => {
    expect(
      offenders.filter((name) => !KNOWN_OFFENDERS.includes(name)),
      "take `now` as an arg and pass it from the caller instead",
    ).toEqual([]);
  });

  /** Otherwise the list rots into a set of excuses nobody can audit. */
  test("every known offender still reads the clock", () => {
    expect(
      KNOWN_OFFENDERS.filter((name) => !offenders.includes(name)),
      "these are fixed — delete them from KNOWN_OFFENDERS",
    ).toEqual([]);
  });

  /** The query the rule was written for, pinned so it cannot slide back. */
  test("mcp.oauth.getClient takes now as an arg", () => {
    const source = readFileSync(join(convexDir, "mcp/oauth.ts"), "utf8");
    const body = definitionBody(source, "getClient");
    expect(body).toContain("now: v.number()");
    expect(stripComments(body)).not.toContain("Date.now()");
  });
});

/**
 * Every `authQuery`/`internalQuery`/`query` definition that names a clock call in
 * its own body, as `file|exportName`.
 *
 * Deliberately source-text: the failure is invisible at runtime — a stale cached
 * result is a well-formed answer to a question asked at the wrong time.
 */
function findClockReadingQueries(): string[] {
  const found: string[] = [];
  const files = readdirSync(convexDir, { recursive: true })
    .map(String)
    .filter((path) => path.endsWith(".ts"))
    // Generated code and bundled copies are not hand-written query definitions.
    .filter((path) => !path.includes("_generated"))
    .filter((path) => !path.endsWith(".generated.ts"));

  for (const path of files) {
    // Comments name the very calls being ruled out, so they have to go first.
    const source = stripComments(readFileSync(join(convexDir, path), "utf8"));
    for (const match of source.matchAll(
      /export const (\w+) = (?:authQuery|internalQuery|query)\(\{/g,
    )) {
      const end = source.indexOf("\n});", match.index);
      const body = source.slice(match.index, end < 0 ? undefined : end);
      if (FORBIDDEN.some((call) => body.includes(call))) {
        found.push(`${path.replaceAll("\\", "/")}|${match[1]}`);
      }
    }
  }
  return found;
}

/**
 * One Convex definition, from `export const <name> = …({` to the `\n});` that
 * closes it. Ending on the closing brace matters: slicing to the next `export`
 * would swallow the un-exported helpers that sit between definitions, and their
 * clock calls are perfectly legal.
 */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
