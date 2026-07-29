import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  QUICK_TASK_FILTER_DEFAULTS,
  quickTaskAssigneeParser,
  quickTaskProjectParser,
  quickTaskTimeRangeParser,
  quickTaskUserParser,
  statusesParser,
} from "@/lib/search-params";

const here = dirname(fileURLToPath(import.meta.url));

describe("QUICK_TASK_FILTER_DEFAULTS", () => {
  /**
   * The toolbar's "Clear all filters" reset project to "all" while the parser
   * defaulted to "none", so clearing left ?project=all in the URL and the page
   * then read its own default as an active filter. One source of truth for both.
   */
  it("matches every parser's default", () => {
    expect(QUICK_TASK_FILTER_DEFAULTS).toEqual({
      project: quickTaskProjectParser.defaultValue,
      user: quickTaskUserParser.defaultValue,
      assignee: quickTaskAssigneeParser.defaultValue,
      tags: [],
      statuses: statusesParser.defaultValue,
      timeRange: quickTaskTimeRangeParser.defaultValue,
    });
  });

  /** Quick tasks are the non-project tasks, so "No Project" is the default view. */
  it("defaults project to none, not all", () => {
    expect(QUICK_TASK_FILTER_DEFAULTS.project).toBe("none");
  });

  it("defaults to every status visible", () => {
    expect(QUICK_TASK_FILTER_DEFAULTS.statuses).toContain("todo");
    expect(QUICK_TASK_FILTER_DEFAULTS.statuses).toContain("cancelled");
  });
});

describe("QuickTasksToolbar", () => {
  const source = readFileSync(
    join(here, "_components/QuickTasksToolbar.tsx"),
    "utf8",
  );

  /**
   * Literals here are how the defaults drifted apart in the first place. Both the
   * "is anything filtered?" check and the clear action have to read the shared
   * constant.
   */
  it("reads cleared state from the shared defaults", () => {
    expect(source).toContain("QUICK_TASK_FILTER_DEFAULTS");
    expect(source).toContain("setParams({ ...QUICK_TASK_FILTER_DEFAULTS });");
  });

  it("does not hard-code a project filter default", () => {
    const code = stripComments(source);
    expect(code).not.toMatch(/projectFilter !== "(all|none)"/);
    expect(code).not.toMatch(/project: "(all|none)"/);
  });

  /**
   * `project` and `user` are URL state; routing them through the old
   * `onProjectFilterChange`/`onUserFilterChange` callbacks instead of `setParams`
   * is what left the URL out of step with the cleared view.
   */
  it("clears project and user through setParams, not the callbacks", () => {
    const clearAt = source.indexOf("const clearAllFilters = () => {");
    expect(clearAt).toBeGreaterThan(-1);
    const body = source.slice(clearAt, source.indexOf("};", clearAt));
    expect(body).not.toContain("onProjectFilterChange(");
    expect(body).not.toContain("onUserFilterChange(");
  });
});

/**
 * Legacy quick-task URLs redirect to the current route shape. Rebuilding
 * `search` from an object literal drops every nuqs-managed filter param, so a
 * stale bookmark silently loses the user's filters — the redirects have to merge
 * `prev`.
 */
describe("legacy quick-task redirects", () => {
  const routes = ["$numId/$detailTab.tsx", "$numId/sandbox/$sandboxTab.tsx"];

  it("merge prev into search on every redirect", () => {
    for (const route of routes) {
      const source = stripComments(readFileSync(join(here, route), "utf8"));
      const calls = redirectCalls(source);
      expect(calls.length, `${route} has no redirect() call`).toBeGreaterThan(
        0,
      );
      for (const call of calls) {
        const searchAt = call.indexOf("search:");
        expect(
          searchAt,
          `${route}: a redirect() has no search prop`,
        ).toBeGreaterThan(-1);
        const search = call.slice(searchAt);
        expect(
          search.slice(0, 40),
          `${route}: search must be a (prev) => ({ ...prev }) callback`,
        ).toContain("search: (prev) => ({");
        // Whatever follows the `({` has to be the spread, so no property the
        // callback sets can shadow a param it was meant to carry over.
        expect(
          search
            .slice(search.indexOf("({") + 2)
            .trimStart()
            .slice(0, 7),
          `${route}: the callback must spread prev first`,
        ).toBe("...prev");
      }
    }
  });
});

/**
 * Each `redirect({ ... })` call, sliced from its opening to the next one. Slicing
 * on the call keeps a `search:` that belongs to a helper's arguments — or to a
 * type annotation — from being read as a redirect's own.
 */
function redirectCalls(source: string): string[] {
  const starts = [...source.matchAll(/\bredirect\(\{/g)].map(
    (match) => match.index,
  );
  return starts.map((start, index) =>
    source.slice(start, starts[index + 1] ?? source.length),
  );
}

function stripComments(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
