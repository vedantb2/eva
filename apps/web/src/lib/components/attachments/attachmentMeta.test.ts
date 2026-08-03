import { describe, expect, test, vi } from "vitest";
import {
  MAX_CHAT_ATTACHMENTS,
  PASTE_ATTACHMENT_THRESHOLD_CHARS,
  attachPastedTextIfLarge,
  buildPastedTextFile,
  isAllowedAttachmentFile,
} from "./attachmentMeta";

/**
 * These guard the paste-to-file fix ("Wall-of-text pastes flooded composers").
 * The behaviour that matters is invisible on screen: whether a paste becomes a
 * `.txt` chip or lands inline. Two boundaries decide that, and both are easy to
 * flip on a refactor (`<` vs `<=`, `>=` vs `>`):
 *
 *  - the 2000-char threshold — one char either side changes the outcome;
 *  - the attachment cap — a full composer must fall back to inline paste, not
 *    silently drop the text.
 *
 * `isAllowedAttachmentFile` lost its `mode` argument in the same change, so a
 * regression could re-narrow it to images only across every composer.
 */

describe("attachPastedTextIfLarge", () => {
  test("pastes shorter than the threshold stay inline", () => {
    const add = vi.fn();
    const text = "a".repeat(PASTE_ATTACHMENT_THRESHOLD_CHARS - 1);
    expect(attachPastedTextIfLarge(text, 0, add)).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  test("a paste exactly at the threshold attaches", () => {
    const add = vi.fn();
    const text = "a".repeat(PASTE_ATTACHMENT_THRESHOLD_CHARS);
    expect(attachPastedTextIfLarge(text, 0, add)).toBe(true);
    expect(add).toHaveBeenCalledTimes(1);
  });

  test("a large paste under the cap attaches one file", () => {
    const add = vi.fn<(files: File[]) => void>();
    const text = "a".repeat(PASTE_ATTACHMENT_THRESHOLD_CHARS + 5000);
    expect(attachPastedTextIfLarge(text, MAX_CHAT_ATTACHMENTS - 1, add)).toBe(
      true,
    );
    expect(add).toHaveBeenCalledTimes(1);
    const [files] = add.mock.calls[0] ?? [[]];
    expect(files).toHaveLength(1);
  });

  test("a large paste at the cap falls back to inline", () => {
    const add = vi.fn();
    const text = "a".repeat(PASTE_ATTACHMENT_THRESHOLD_CHARS + 5000);
    expect(attachPastedTextIfLarge(text, MAX_CHAT_ATTACHMENTS, add)).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });
});

describe("buildPastedTextFile", () => {
  test("names the file and marks it plain text", async () => {
    const file = buildPastedTextFile("hello world");
    expect(file.name).toBe("pasted-text.txt");
    expect(file.type).toBe("text/plain");
    expect(await file.text()).toBe("hello world");
  });
});

describe("isAllowedAttachmentFile", () => {
  test("accepts images by content type", () => {
    expect(isAllowedAttachmentFile({ mediaType: "image/png" })).toBe(true);
  });

  test("accepts design and spec text across every composer", () => {
    expect(isAllowedAttachmentFile({ mediaType: "text/plain" })).toBe(true);
    expect(isAllowedAttachmentFile({ mediaType: "text/html" })).toBe(true);
    expect(isAllowedAttachmentFile({ mediaType: "text/markdown" })).toBe(true);
  });

  test("accepts text files by extension when the type is missing", () => {
    expect(isAllowedAttachmentFile({ filename: "spec.md" })).toBe(true);
    expect(isAllowedAttachmentFile({ filename: "notes.txt" })).toBe(true);
    expect(isAllowedAttachmentFile({ filename: "design.html" })).toBe(true);
  });

  test("rejects everything else", () => {
    expect(isAllowedAttachmentFile({ mediaType: "application/pdf" })).toBe(
      false,
    );
    expect(isAllowedAttachmentFile({ filename: "archive.zip" })).toBe(false);
    expect(isAllowedAttachmentFile({})).toBe(false);
  });
});
