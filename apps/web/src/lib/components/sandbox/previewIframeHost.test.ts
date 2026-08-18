import { describe, expect, test } from "vitest";
import {
  dropPreviewGroup,
  getPreviewMeta,
  setPreviewMeta,
} from "./previewIframeHost";

/**
 * Preview iframes outlive the router so route changes do not reload the app
 * under development, and each sandbox:port keeps resolution meta so a
 * remounting panel can skip the loading overlay. That cache has to die with
 * its sandbox: kept too long it seeds a dead URL, and dropped too eagerly it
 * takes another sandbox's live preview down with it.
 */

function meta(url: string) {
  return {
    previewInfo: { url, port: 3000 },
    strippedTarget: url,
    epoch: 1,
  };
}

describe("preview meta cache", () => {
  test("is keyed per sandbox and port", () => {
    setPreviewMeta("sbx_a:3000", meta("https://a-3000.vercel.run/"));
    setPreviewMeta("sbx_a:5173", meta("https://a-5173.vercel.run/"));

    expect(getPreviewMeta("sbx_a:3000")?.previewInfo.url).toBe(
      "https://a-3000.vercel.run/",
    );
    expect(getPreviewMeta("sbx_a:5173")?.previewInfo.url).toBe(
      "https://a-5173.vercel.run/",
    );
    expect(getPreviewMeta("sbx_a:9999")).toBeUndefined();
  });

  test("dropping a sandbox clears every port it cached", () => {
    setPreviewMeta("sbx_b:3000", meta("https://b-3000.vercel.run/"));
    setPreviewMeta("sbx_b:5173", meta("https://b-5173.vercel.run/"));

    dropPreviewGroup("sbx_b");

    expect(getPreviewMeta("sbx_b:3000")).toBeUndefined();
    expect(getPreviewMeta("sbx_b:5173")).toBeUndefined();
  });

  test("dropping a sandbox spares one whose id it prefixes", () => {
    setPreviewMeta("sbx_c:3000", meta("https://c-3000.vercel.run/"));
    setPreviewMeta("sbx_c2:3000", meta("https://c2-3000.vercel.run/"));

    dropPreviewGroup("sbx_c");

    expect(getPreviewMeta("sbx_c:3000")).toBeUndefined();
    expect(getPreviewMeta("sbx_c2:3000")?.previewInfo.url).toBe(
      "https://c2-3000.vercel.run/",
    );
  });

  test("dropping an unknown sandbox is a no-op", () => {
    setPreviewMeta("sbx_d:3000", meta("https://d-3000.vercel.run/"));

    dropPreviewGroup("sbx_never_started");

    expect(getPreviewMeta("sbx_d:3000")?.previewInfo.url).toBe(
      "https://d-3000.vercel.run/",
    );
  });
});
