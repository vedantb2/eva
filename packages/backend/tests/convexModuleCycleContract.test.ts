import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

/**
 * Convex prod pushes failed at `evaluate_push` with "Failed to analyze
 * _github/api.js: d is not a function" (and before that pty.js: "l is not a
 * function"), which names neither the cycle nor the module that caused it.
 *
 * The cause was `functions.ts` importing `getCurrentUserId` from `auth.ts`
 * while `auth.ts` imports `authQuery`/`authMutation` back from `functions.ts`.
 * The isolate bundle tolerated the cycle, but in a `"use node"` action chunk
 * `auth.ts` could evaluate first and call an `authQuery` that was still
 * undefined (fix 94229910a). Nothing else catches this: types check, the
 * isolate deploys, and the failure only appears on a prod push.
 */

/** Every hand-written convex module, repo-relative and posix-separated. */
function convexModules(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        // Generated api/server shims are rewritten on every deploy.
        if (entry !== "_generated") walk(path);
        continue;
      }
      if (!path.endsWith(".ts") || path.endsWith(".d.ts")) continue;
      // Bundled copies of source that is audited at its origin.
      if (path.endsWith(".generated.ts")) continue;
      found.push(moduleId(path));
    }
  };
  walk(convexDir);
  return found;
}

function moduleId(absolutePath: string): string {
  return relative(convexDir, absolutePath).replaceAll("\\", "/");
}

const IMPORT_STATEMENT =
  /(?:^|[\n;])\s*(?:import|export)(?:\s+type)?\s+(?:[^;'"]*?\s+from\s+)?["']([^"']+)["']/g;

/**
 * Type-only imports are erased before the bundle runs, so they cannot make a
 * module evaluate early and cannot form an initialisation cycle. Covers both
 * `import type { X }` and `import { type X }` where every specifier is a type.
 */
function isTypeOnly(statement: string): boolean {
  if (/^[\s;]*(?:import|export)\s+type\s/.test(statement)) return true;
  const braces = statement.match(/\{([^}]*)\}/);
  if (!braces) return false;
  // A default import alongside the braces is a value import regardless.
  if (/^[\s;]*import\s+\w+\s*,/.test(statement)) return false;
  const specifiers = braces[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return (
    specifiers.length > 0 &&
    specifiers.every((name) => name.startsWith("type "))
  );
}

/** Value-import edges between hand-written convex modules. */
function importGraph(): Map<string, string[]> {
  const modules = convexModules();
  const known = new Set(modules);
  const graph = new Map<string, string[]>();

  for (const id of modules) {
    const absolute = join(convexDir, id);
    const source = readFileSync(absolute, "utf8");
    const edges: string[] = [];

    for (const match of source.matchAll(IMPORT_STATEMENT)) {
      if (isTypeOnly(match[0])) continue;
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      const base = resolve(dirname(absolute), specifier);
      for (const candidate of [`${base}.ts`, join(base, "index.ts")]) {
        if (!existsSync(candidate)) continue;
        const target = moduleId(candidate);
        if (known.has(target)) edges.push(target);
        break;
      }
    }

    graph.set(id, edges);
  }

  return graph;
}

/** Every import cycle, each reported as the ring of modules that forms it. */
function importCycles(): string[][] {
  const graph = importGraph();
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const done = new Set<string>();
  const stack: string[] = [];

  const walk = (id: string) => {
    visiting.add(id);
    stack.push(id);
    for (const next of graph.get(id) ?? []) {
      if (visiting.has(next)) {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      } else if (!done.has(next)) {
        walk(next);
      }
    }
    stack.pop();
    visiting.delete(id);
    done.add(id);
  };

  for (const id of graph.keys()) if (!done.has(id)) walk(id);
  return cycles;
}

const cycles = importCycles();

/** Ring members, order-independent, so a rotated cycle still matches. */
function cycleKey(cycle: string[]): string {
  return [...new Set(cycle)].sort().join(" + ");
}

describe("convex module import cycles", () => {
  /**
   * `functions.ts` builds authQuery/authMutation/authAction, so every other
   * module's exports are constructed from it at import time. A cycle through
   * it means some module can run before those factories exist — exactly the
   * deploy failure above.
   */
  it("no cycle reaches the function-wrapper module", () => {
    const offenders = cycles
      .filter((cycle) => cycle.includes("functions.ts"))
      .map((cycle) => cycle.join(" -> "));
    expect(
      offenders,
      "functions.ts is in an import cycle; Convex deploy analysis will fail " +
        'with "<minified> is not a function". Move the shared helper into a ' +
        "leaf module (see _auth/currentUser.ts) and point both sides at it.",
    ).toEqual([]);
  });

  /**
   * The leaf the fix created. It exists only so `functions.ts` can read the
   * signed-in user without importing `auth.ts`; a runtime import here would
   * re-form the cycle by another route.
   */
  it("_auth/currentUser.ts stays a leaf", () => {
    const edges = importGraph().get("_auth/currentUser.ts");
    expect(
      edges,
      "_auth/currentUser.ts must import types only — a value import can " +
        "reopen the functions.ts <-> auth.ts cycle it was extracted to break",
    ).toEqual([]);
  });

  /**
   * The three rings that predate the fix. They survive prod today because
   * they sit between siblings that are only reached from the isolate bundle,
   * but each is the same latent hazard, so the list must shrink, not grow.
   */
  it("adds no cycle beyond the known ones", () => {
    const known = new Set([
      cycleKey(["_chat/surfaceAdapters.ts", "_queues/helpers.ts"]),
      cycleKey(["_taskWorkflow/helpers.ts", "_taskWorkflow/recovery.ts"]),
      cycleKey(["_sandbox_runtime/helpers.ts", "_sandbox_runtime/launch.ts"]),
    ]);
    const added = cycles
      .filter((cycle) => !known.has(cycleKey(cycle)))
      .map((cycle) => cycle.join(" -> "));
    expect(
      added,
      "new import cycle in convex/. A cycle that lands in a \"use node\" " +
        "action chunk breaks the prod push with an unreadable minified error, " +
        "so break it rather than adding it here.",
    ).toEqual([]);
  });
});
