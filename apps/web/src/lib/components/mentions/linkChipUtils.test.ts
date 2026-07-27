import { expect, test } from "vitest";
import {
  countLinkUrls,
  findLinkUrls,
  isChipLinkUrl,
  linkLabel,
  linkProvider,
} from "./linkChipUtils";

// Guards the multi-provider link-chip support (Figma/GitHub/Linear/Sentry/
// PostHog). A regression here silently drops chip rendering for a provider.
test("linkProvider identifies each supported provider by host", () => {
  expect(linkProvider("https://www.figma.com/design/ABC/My-File")).toBe(
    "figma",
  );
  expect(linkProvider("https://github.com/owner/repo")).toBe("github");
  expect(linkProvider("https://linear.app/team/issue/ENG-1/slug")).toBe(
    "linear",
  );
  expect(linkProvider("https://acme.sentry.io/issues/123")).toBe("sentry");
  expect(linkProvider("https://eu.posthog.com/project/1")).toBe("posthog");
});

test("linkProvider returns null for unrelated or non-http URLs", () => {
  expect(linkProvider("https://example.com/figma.com")).toBeNull();
  expect(linkProvider("mailto:figma.com")).toBeNull();
  expect(linkProvider("not a url")).toBeNull();
  expect(isChipLinkUrl("https://example.com")).toBe(false);
  expect(isChipLinkUrl("https://github.com/owner/repo")).toBe(true);
});

test("figma label uses the file-name path segment, else falls back", () => {
  expect(linkLabel("https://www.figma.com/design/KEY/Design-System")).toBe(
    "Design System",
  );
  // Missing file-name segment falls back to the provider name.
  expect(linkLabel("https://www.figma.com/design/KEY")).toBe("Figma");
});

test("github label shows owner/repo, or repo#number for pull/issue URLs", () => {
  expect(linkLabel("https://github.com/vercel/next.js")).toBe("vercel/next.js");
  expect(linkLabel("https://github.com/vercel/next.js/pull/42")).toBe(
    "next.js#42",
  );
  expect(linkLabel("https://github.com/vercel/next.js/issues/7")).toBe(
    "next.js#7",
  );
  // Non-numeric trailing segment is not a PR/issue reference.
  expect(linkLabel("https://github.com/vercel/next.js/tree/main")).toBe(
    "vercel/next.js",
  );
});

test("linear label extracts and upper-cases the issue id", () => {
  expect(linkLabel("https://linear.app/acme/issue/eng-123/fix-bug")).toBe(
    "ENG-123",
  );
  // No issue segment falls back to the provider name.
  expect(linkLabel("https://linear.app/acme/team/all")).toBe("Linear");
});

test("linkLabel returns the raw URL when no provider matches", () => {
  expect(linkLabel("https://example.com/path")).toBe(
    "https://example.com/path",
  );
});

test("findLinkUrls scans prose in order and stops at whitespace/paren", () => {
  const text =
    "see https://github.com/owner/repo and (https://linear.app/a/issue/X-1/s) done";
  expect(findLinkUrls(text)).toEqual([
    "https://github.com/owner/repo",
    "https://linear.app/a/issue/X-1/s",
  ]);
  expect(countLinkUrls(text)).toBe(2);
  expect(countLinkUrls("no links here")).toBe(0);
});
