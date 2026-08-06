import { describe, expect, it } from "vitest";
import {
  countLinkUrls,
  isChipLinkUrl,
  linkLabel,
  linkProvider,
} from "./linkChipUtils";

// Regression: chips used to show shortened IDs (e.g. "DEV-7004", "Figma") that
// gave no context when scanning pasted links. The label now shows host + path
// with the protocol and `www.` stripped, so these cases guard that behaviour.
describe("linkLabel", () => {
  it("shows host and path without protocol or www", () => {
    expect(linkLabel("https://www.figma.com/design/KEY/My-File")).toBe(
      "figma.com/design/KEY/My-File",
    );
    expect(
      linkLabel("https://github.com/evalucom/carepulse-ts/pull/204"),
    ).toBe("github.com/evalucom/carepulse-ts/pull/204");
  });

  it("drops the trailing slug on Linear issue URLs", () => {
    expect(
      linkLabel("https://linear.app/evalucom/issue/DEV-7002/some-readable-slug"),
    ).toBe("linear.app/evalucom/issue/DEV-7002");
  });

  it("keeps the full path for non-issue Linear URLs", () => {
    expect(linkLabel("https://linear.app/evalucom/team/DEV/active")).toBe(
      "linear.app/evalucom/team/DEV/active",
    );
  });

  it("keeps provider subdomains for sentry and posthog hosts", () => {
    expect(
      linkLabel("https://evalucom.sentry.io/issues/12345"),
    ).toBe("evalucom.sentry.io/issues/12345");
    expect(linkLabel("https://eu.posthog.com/project/5691")).toBe(
      "eu.posthog.com/project/5691",
    );
  });

  it("falls back to the raw URL when it is not a chip link", () => {
    expect(linkLabel("https://example.com/whatever")).toBe(
      "https://example.com/whatever",
    );
  });
});

describe("linkProvider", () => {
  it("detects each supported provider", () => {
    expect(linkProvider("https://www.figma.com/design/KEY")).toBe("figma");
    expect(linkProvider("https://github.com/evalucom/repo")).toBe("github");
    expect(linkProvider("https://linear.app/evalucom/issue/DEV-1")).toBe(
      "linear",
    );
    expect(linkProvider("https://evalucom.sentry.io/issues/1")).toBe("sentry");
    expect(linkProvider("https://eu.posthog.com/project/1")).toBe("posthog");
  });

  it("returns null for unsupported URLs", () => {
    expect(linkProvider("https://example.com")).toBeNull();
    expect(isChipLinkUrl("https://example.com")).toBe(false);
  });
});

describe("countLinkUrls", () => {
  it("counts every chip link in free prose", () => {
    const text =
      "See https://linear.app/evalucom/issue/DEV-1 and " +
      "https://github.com/evalucom/repo/pull/2, ignore https://example.com";
    expect(countLinkUrls(text)).toBe(2);
  });
});
