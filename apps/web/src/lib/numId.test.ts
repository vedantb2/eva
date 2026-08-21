import { describe, expect, it } from "vitest";
import { parseRouteNumId, replaceRouteIdSegment } from "./numId";

describe("parseRouteNumId", () => {
  it("accepts positive integers and rejects Convex ids", () => {
    expect(parseRouteNumId("12")).toBe(12);
    expect(parseRouteNumId("0")).toBeNull();
    expect(parseRouteNumId("kd7abc123xyz456def789ghi012jkl")).toBeNull();
  });
});

describe("replaceRouteIdSegment", () => {
  const legacyId = "kd7abc123xyz456def789ghi012jkl";

  it("swaps the legacy id for the numId and keeps the rest of the path", () => {
    expect(
      replaceRouteIdSegment(`/acme/app/quick-tasks/${legacyId}`, legacyId, 7),
    ).toBe("/acme/app/quick-tasks/7");
  });

  it("keeps trailing route segments (tabs, sub-views)", () => {
    expect(
      replaceRouteIdSegment(
        `/acme/app/docs/${legacyId}/content`,
        legacyId,
        41,
      ),
    ).toBe("/acme/app/docs/41/content");
  });

  it("only touches its own segment so nested ids redirect independently", () => {
    const taskId = "kd9zzz999yyy888xxx777www666vvv";
    expect(
      replaceRouteIdSegment(
        `/acme/app/projects/${legacyId}/${taskId}/activity`,
        legacyId,
        3,
      ),
    ).toBe(`/acme/app/projects/3/${taskId}/activity`);
  });
});
