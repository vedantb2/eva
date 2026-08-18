import { describe, expect, it } from "vitest";
import { buildDiffFileEntries } from "./diffFiles";

const PROCUREMENTS = "apps/eprocurement/convex/procurements.ts";

function patch(path: string, added: string): string {
  return [
    `diff --git a/${path} b/${path}`,
    "index 1111111..2222222 100644",
    `--- a/${path}`,
    `+++ b/${path}`,
    "@@ -1,1 +1,2 @@",
    " const a = 1;",
    `+${added}`,
  ].join("\n");
}

describe("buildDiffFileEntries", () => {
  it("keeps the first patch when a path is repeated", () => {
    const diff = [
      patch(PROCUREMENTS, "const b = 2;"),
      patch("apps/eprocurement/convex/schema.ts", "const c = 3;"),
      patch(PROCUREMENTS, "const d = 4;"),
    ].join("\n");

    const entries = buildDiffFileEntries(diff);

    expect(entries.map((entry) => entry.path)).toEqual([
      PROCUREMENTS,
      "apps/eprocurement/convex/schema.ts",
    ]);
    expect(entries[0].patch).toContain("const b = 2;");
  });

  it("reads path, status, and counts from each patch", () => {
    const entries = buildDiffFileEntries(patch(PROCUREMENTS, "const b = 2;"));

    expect(entries).toHaveLength(1);
    expect(entries[0].path).toBe(PROCUREMENTS);
    expect(entries[0].status).toBe("modified");
    expect(entries[0].additions).toBe(1);
    expect(entries[0].deletions).toBe(0);
  });
});
