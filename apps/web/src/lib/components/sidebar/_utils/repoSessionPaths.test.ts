import { describe, expect, test } from "vitest";
import {
  repoBasePaths,
  repoMatchesPath,
  repoSessionsIndexPath,
  sessionHrefForRow,
  sessionRowMatchesPath,
} from "./repoSessionPaths";

const rootRepo = { owner: "acme", name: "eva" };
const appRepo = { owner: "acme", name: "eva", rootDirectory: "apps/web" };
const linkedFrom = { owner: "acme", name: "backend" };

describe("repoBasePaths", () => {
  test("root repo has one base", () => {
    expect(repoBasePaths(rootRepo)).toEqual(["/acme/eva"]);
  });

  test("monorepo app has slash and `--` bases", () => {
    expect(repoBasePaths(appRepo)).toEqual(["/acme/eva/web", "/acme/eva--web"]);
  });

  test("repoMatchesPath accepts either form", () => {
    expect(repoMatchesPath(appRepo, "/acme/eva--web/sessions")).toBe(true);
    expect(repoMatchesPath(appRepo, "/acme/eva/web/sessions")).toBe(true);
    expect(repoMatchesPath(appRepo, "/acme/other/sessions")).toBe(false);
  });

  test("sessions index is the slash form", () => {
    expect(repoSessionsIndexPath(appRepo)).toBe("/acme/eva/web/sessions");
  });
});

describe("sessionHrefForRow", () => {
  test("own row links under its app", () => {
    expect(sessionHrefForRow(rootRepo, { numId: 7 })).toBe(
      "/acme/eva/sessions/7",
    );
  });

  test("monorepo app row uses the router-internal `--` form", () => {
    expect(sessionHrefForRow(appRepo, { numId: 7 })).toBe(
      "/acme/eva--web/sessions/7",
    );
  });

  test("linked-in row links to the primary repo's session URL", () => {
    expect(sessionHrefForRow(rootRepo, { numId: 7, linkedFrom })).toBe(
      "/acme/backend/sessions/7",
    );
  });

  test("linked-in row honours the primary's monorepo app", () => {
    expect(
      sessionHrefForRow(rootRepo, {
        numId: 7,
        linkedFrom: { ...linkedFrom, rootDirectory: "services/api" },
      }),
    ).toBe("/acme/backend--api/sessions/7");
  });

  test("falls back to the sessions index without a numId", () => {
    expect(sessionHrefForRow(rootRepo, {})).toBe("/acme/eva/sessions");
  });
});

describe("sessionRowMatchesPath", () => {
  test("matches its own app in either URL form", () => {
    expect(
      sessionRowMatchesPath(appRepo, { numId: 7 }, "/acme/eva--web/sessions/7"),
    ).toBe(true);
    expect(
      sessionRowMatchesPath(appRepo, { numId: 7 }, "/acme/eva/web/sessions/7"),
    ).toBe(true);
  });

  test("matches sub-pages of the session", () => {
    expect(
      sessionRowMatchesPath(
        rootRepo,
        { numId: 7 },
        "/acme/eva/sessions/7/review/diffs",
      ),
    ).toBe(true);
  });

  test("a linked-in row is active on the primary repo's URL, not this app's", () => {
    expect(
      sessionRowMatchesPath(
        rootRepo,
        { numId: 7, linkedFrom },
        "/acme/backend/sessions/7",
      ),
    ).toBe(true);
    expect(
      sessionRowMatchesPath(
        rootRepo,
        { numId: 7, linkedFrom },
        "/acme/eva/sessions/7",
      ),
    ).toBe(false);
  });

  test("never matches without a numId", () => {
    expect(sessionRowMatchesPath(rootRepo, {}, "/acme/eva/sessions")).toBe(
      false,
    );
  });

  test("does not match a different session", () => {
    expect(
      sessionRowMatchesPath(rootRepo, { numId: 7 }, "/acme/eva/sessions/70"),
    ).toBe(false);
  });
});
