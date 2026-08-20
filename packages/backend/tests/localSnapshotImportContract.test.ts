import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

// Comments here name the very flag the rules below rule out, so they have to go.
const syncToLocal = stripComments(readSource("scripts/sync-to-local.mjs"));

/**
 * `convex import --replace-all` is deployment-wide *even alongside*
 * `--component`: it clears every table in the schema the import file omits,
 * which for a component zip is all of the root tables. The seeding script
 * therefore deleted everything the root import had just written — the change
 * summary read `githubRepos | 0 create | 17 of 17 delete`, and every seeded
 * sandbox came up with an empty app database (fix 79fadb3c). The two imports
 * need opposite flags, and the difference is four characters, so pin it.
 */
describe("seeding a local backend imports components without wiping root tables", () => {
  test("the root snapshot import mirrors, so it clears omitted tables", () => {
    const rootImport = statement(syncToLocal, 'runConvex(["import"');
    expect(rootImport).toContain('"--replace-all"');
    expect(rootImport).toContain("zipPath");
  });

  test("a component import only replaces the tables its own zip carries", () => {
    const componentImport = block(
      syncToLocal,
      "for (const component of componentZips) {",
    );
    expect(componentImport).toContain('"--component"');
    expect(componentImport).toContain('"--replace"');
    expect(
      componentImport,
      "--replace-all under --component clears the root tables too",
    ).not.toContain('"--replace-all"');
  });

  /** The mirror flag belongs to exactly one call — the root import above. */
  test("nothing else in the script asks for a deployment-wide replace", () => {
    expect(syncToLocal.split('"--replace-all"').length - 1).toBe(1);
  });

  /**
   * Root first is what makes the local deployment a mirror rather than a merge;
   * a component import ahead of it would be erased by the root's `--replace-all`.
   */
  test("the root import runs before the component imports", () => {
    expect(syncToLocal.indexOf('runConvex(["import"')).toBeLessThan(
      syncToLocal.indexOf("for (const component of componentZips) {"),
    );
  });
});

function readSource(relativePath: string): string {
  return readFileSync(join(backendDir, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

/** From a call's opening text to the `);` that closes it. */
function statement(source: string, opener: string): string {
  const startAt = source.indexOf(opener);
  expect(startAt, `${opener} moved or was renamed`).toBeGreaterThan(-1);
  const endAt = source.indexOf("\n});", startAt);
  expect(endAt, `${opener} is no longer a call`).toBeGreaterThan(-1);
  return source.slice(startAt, endAt);
}

/** One braced block, matched by counting braces from its opening line. */
function block(source: string, opener: string): string {
  const startAt = source.indexOf(opener);
  expect(startAt, `${opener} moved or was renamed`).toBeGreaterThan(-1);
  let depth = 0;
  for (let at = startAt + opener.length - 1; at < source.length; at += 1) {
    if (source[at] === "{") depth += 1;
    else if (source[at] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(startAt, at + 1);
    }
  }
  throw new Error(`unterminated block at ${opener}`);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
