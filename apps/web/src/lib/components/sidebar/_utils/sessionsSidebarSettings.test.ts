import { describe, expect, test } from "vitest";
import {
  DEFAULT_SESSION_PREVIEW_COUNT,
  MAX_SESSION_PREVIEW_COUNT,
  MIN_SESSION_PREVIEW_COUNT,
  clampSessionPreviewCount,
  isAppSortOrder,
  isSessionLayout,
  isSessionListMode,
  isSessionSortOrder,
  sessionActivityAt,
  sortAppsForSidebar,
  sortSessionsForSidebar,
} from "./sessionsSidebarSettings";

describe("sessions sidebar settings parsing", () => {
  test.each(["updated_at", "created_at", "manual"])(
    "accepts app sort %s",
    (value) => expect(isAppSortOrder(value)).toBe(true),
  );

  test.each(["updated_at", "created_at"])("accepts session sort %s", (value) =>
    expect(isSessionSortOrder(value)).toBe(true),
  );

  test.each(["active", "archived"])("accepts list mode %s", (value) => {
    expect(isSessionListMode(value)).toBe(true);
  });

  test.each(["list", "folder"])("accepts layout %s", (value) => {
    expect(isSessionLayout(value)).toBe(true);
  });

  test.each(["", "recent", "grid", "ACTIVE"])(
    "rejects stale persisted value %s",
    (value) => {
      expect(isAppSortOrder(value)).toBe(false);
      expect(isSessionSortOrder(value)).toBe(false);
      expect(isSessionListMode(value)).toBe(false);
      expect(isSessionLayout(value)).toBe(false);
    },
  );
});

describe("session preview count", () => {
  test("clamps below and above the supported range", () => {
    expect(clampSessionPreviewCount(-1)).toBe(MIN_SESSION_PREVIEW_COUNT);
    expect(clampSessionPreviewCount(100)).toBe(MAX_SESSION_PREVIEW_COUNT);
  });

  test("rounds persisted fractional values", () => {
    expect(clampSessionPreviewCount(4.6)).toBe(5);
    expect(clampSessionPreviewCount(4.4)).toBe(4);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "falls back for non-finite %s",
    (value) => {
      expect(clampSessionPreviewCount(value)).toBe(
        DEFAULT_SESSION_PREVIEW_COUNT,
      );
    },
  );
});

describe("sidebar activity ordering", () => {
  const older = { id: "older", _id: "older", _creationTime: 10, updatedAt: 30 };
  const newer = { id: "newer", _id: "newer", _creationTime: 20, updatedAt: 40 };
  const createdOnly = { id: "created", _id: "created", _creationTime: 50 };

  test("uses updatedAt when present and creation time otherwise", () => {
    expect(sessionActivityAt(older)).toBe(30);
    expect(sessionActivityAt(createdOnly)).toBe(50);
  });

  test("sorts sessions by activity without mutating the query result", () => {
    const input = [older, createdOnly, newer];
    expect(
      sortSessionsForSidebar(input, "updated_at").map((row) => row.id),
    ).toEqual(["created", "newer", "older"]);
    expect(input.map((row) => row.id)).toEqual(["older", "created", "newer"]);
  });

  test("sorts sessions by creation independently of message activity", () => {
    expect(
      sortSessionsForSidebar([older, createdOnly, newer], "created_at").map(
        (row) => row.id,
      ),
    ).toEqual(["created", "newer", "older"]);
  });

  test("sorts apps by latest child activity with creation fallback", () => {
    const activity = new Map<string, number>([["older", 100]]);
    expect(
      sortAppsForSidebar(
        [newer, createdOnly, older],
        "updated_at",
        activity,
      ).map((row) => row.id),
    ).toEqual(["older", "created", "newer"]);
  });

  test("keeps manual app order untouched", () => {
    const input = [newer, older, createdOnly];
    expect(sortAppsForSidebar(input, "manual", new Map())).toBe(input);
  });
});
