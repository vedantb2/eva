import { describe, expect, it } from "vitest";
import { repoHref, toDisplayRepoHref, toInternalRepoHref } from "./repoUrl";

describe("repoUrl monorepo slash rewrite", () => {
  it("repoHref is the public slash form", () => {
    expect(repoHref("evalucom", "carepulse-ts", "apps/web")).toBe(
      "/evalucom/carepulse-ts/web",
    );
  });

  it("round-trips slash ↔ dash", () => {
    const slash = "/evalucom/carepulse-ts/web/quick-tasks/204";
    const dash = "/evalucom/carepulse-ts--web/quick-tasks/204";
    expect(toInternalRepoHref(slash)).toBe(dash);
    expect(toDisplayRepoHref(dash)).toBe(slash);
  });

  it("does not treat repo sections as app names", () => {
    expect(toInternalRepoHref("/evalucom/carepulse-ts/quick-tasks")).toBe(
      "/evalucom/carepulse-ts/quick-tasks",
    );
    expect(toInternalRepoHref("/evalucom/carepulse-ts/drafts")).toBe(
      "/evalucom/carepulse-ts/drafts",
    );
  });
});
