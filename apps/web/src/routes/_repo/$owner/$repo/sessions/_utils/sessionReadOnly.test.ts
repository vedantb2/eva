import { describe, expect, test } from "vitest";
import {
  getSessionReadOnlyMessage,
  isSessionPrReadOnly,
  isSessionSidebarActive,
  type SessionPrState,
} from "./sessionReadOnly";

describe("session PR read-only state", () => {
  test.each<[SessionPrState | undefined, boolean]>([
    [undefined, false],
    ["draft", false],
    ["open", false],
    ["merged", true],
    ["closed", true],
  ])("%s -> %s", (state, expected) => {
    expect(isSessionPrReadOnly(state)).toBe(expected);
  });

  test("manual archive removes an otherwise live session from Active", () => {
    expect(isSessionSidebarActive({ archived: true, prState: "open" })).toBe(
      false,
    );
  });

  test.each<SessionPrState>(["merged", "closed"])(
    "%s removes a non-archived session from Active",
    (prState) => {
      expect(isSessionSidebarActive({ archived: false, prState })).toBe(false);
    },
  );

  test("draft, open and no-PR sessions remain active", () => {
    expect(isSessionSidebarActive({ prState: "draft" })).toBe(true);
    expect(isSessionSidebarActive({ prState: "open" })).toBe(true);
    expect(isSessionSidebarActive({})).toBe(true);
  });

  test("terminal PR reason wins over the generic archive message", () => {
    expect(
      getSessionReadOnlyMessage({ isArchived: true, prState: "merged" }),
    ).toContain("merged");
    expect(
      getSessionReadOnlyMessage({ isArchived: true, prState: "closed" }),
    ).toContain("closed");
  });

  test("manual archive has its own fallback and live sessions have none", () => {
    expect(
      getSessionReadOnlyMessage({ isArchived: true, prState: "open" }),
    ).toContain("archived");
    expect(
      getSessionReadOnlyMessage({ isArchived: false, prState: "open" }),
    ).toBeUndefined();
  });
});
