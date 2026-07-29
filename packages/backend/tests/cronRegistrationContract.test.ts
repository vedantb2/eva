import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

const cronManager = readSource("cronManager.ts");

/**
 * The crons component keys on name, so registering a name it already holds
 * fails. Deletion used to be gated on the `cronJobId` we stored ourselves, and
 * that id drifts — cleared on disable while the component row survived — so
 * re-enabling an automation could never register its cron again (fix ef9f0652).
 */
describe("a cron is deleted by name before it is re-registered", () => {
  const deleteFn = functionBody(
    cronManager,
    "export async function safeDeleteCron(",
  );

  test("existence is checked against the component, not our own tables", () => {
    expect(deleteFn).toContain("crons.get(ctx, { name })");
  });

  test("the delete is not gated on a tracked id", () => {
    expect(
      deleteFn,
      "a stale stored id must not stop the delete",
    ).not.toContain("cronJobId");
  });

  test("the replace deletes before it registers", () => {
    const replaceFn = functionBody(
      cronManager,
      "export async function safeReplaceCron<",
    );
    const deleteAt = replaceFn.indexOf("safeDeleteCron(ctx,");
    const registerAt = replaceFn.indexOf("crons.register(");
    expect(deleteAt, "the delete call moved").toBeGreaterThan(-1);
    expect(registerAt, "the register call moved").toBeGreaterThan(-1);
    expect(deleteAt).toBeLessThan(registerAt);
  });

  /**
   * The rule only holds if every caller goes through the pair. A direct register
   * anywhere else reintroduces the name collision on its own path.
   */
  test("nothing registers a cron outside cronManager", () => {
    const callers = convexFiles()
      .filter((path) => path !== "cronManager.ts")
      .filter((path) => readSource(path).includes("crons.register("));
    expect(callers, "register via safeReplaceCron instead").toEqual([]);
  });

  /** Same for deletes: a bare component delete skips the existence check. */
  test("nothing deletes a cron outside cronManager", () => {
    const callers = convexFiles()
      .filter((path) => path !== "cronManager.ts")
      .filter((path) => readSource(path).includes("crons.delete("));
    expect(callers, "delete via safeDeleteCron instead").toEqual([]);
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(convexDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

function convexFiles(): string[] {
  return readdirSync(convexDir, { recursive: true })
    .map((entry) => String(entry).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts"))
    .filter((path) => !path.includes("_generated"));
}

/** Slices from a declaration to the next top-level one. */
function functionBody(source: string, declaration: string): string {
  const startAt = source.indexOf(declaration);
  expect(startAt, `${declaration} moved or was renamed`).toBeGreaterThan(-1);
  const nextAt = source.indexOf("\nexport ", startAt + 1);
  return source.slice(startAt, nextAt < 0 ? undefined : nextAt);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
