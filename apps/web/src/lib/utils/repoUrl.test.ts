import { describe, expect, it } from "vitest";
import {
  repoHref,
  repoPublicHref,
  toDisplayRepoHref,
  toInternalRepoHref,
} from "./repoUrl";

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

  // Regression: clicking a monorepo card carried a `?query`/`#hash`, and the
  // rewrite dropped it — the address bar flipped and the card hard-loaded a bare
  // dash URL. Both directions must carry the suffix through untouched.
  it("preserves the query/hash suffix in both directions", () => {
    expect(
      toInternalRepoHref("/evalucom/carepulse-ts/web/quick-tasks/204?draft=1"),
    ).toBe("/evalucom/carepulse-ts--web/quick-tasks/204?draft=1");
    expect(
      toDisplayRepoHref("/evalucom/carepulse-ts--web/sessions#thread-9"),
    ).toBe("/evalucom/carepulse-ts/web/sessions#thread-9");
  });

  // Regression: `/teams/…` and other global roots share the three-segment shape
  // of a monorepo path, so a naive rewrite mangled them into `teams--…`.
  it("leaves global (non-repo) prefixes untouched", () => {
    expect(toInternalRepoHref("/teams/design/activity")).toBe(
      "/teams/design/activity",
    );
    expect(toInternalRepoHref("/settings/profile/edit")).toBe(
      "/settings/profile/edit",
    );
  });

  // Regression: a href already in dash form must not be re-encoded into
  // `repo--app--app` when its third segment is an app name, not a sub-page.
  it("does not double-encode an already-internal dash href", () => {
    expect(toInternalRepoHref("/evalucom/carepulse-ts--web/dashboard")).toBe(
      "/evalucom/carepulse-ts--web/dashboard",
    );
  });

  // A plain repo URL (no monorepo app) has nothing to convert either way.
  it("leaves single-repo hrefs unchanged", () => {
    expect(toDisplayRepoHref("/evalucom/carepulse-ts/sessions")).toBe(
      "/evalucom/carepulse-ts/sessions",
    );
    expect(toInternalRepoHref("/evalucom/carepulse-ts/sessions")).toBe(
      "/evalucom/carepulse-ts/sessions",
    );
  });

  it("repoPublicHref yields slash form for shareable links", () => {
    expect(repoPublicHref("evalucom", "carepulse-ts", "apps/web")).toBe(
      "/evalucom/carepulse-ts/web",
    );
    expect(repoPublicHref("evalucom", "carepulse-ts")).toBe(
      "/evalucom/carepulse-ts",
    );
  });
});
