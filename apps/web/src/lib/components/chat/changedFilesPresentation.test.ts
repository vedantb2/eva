import { describe, expect, it } from "vitest";
import type { ChangedFile } from "@/lib/components/chat/ChangedFilesCard";
import {
  selectChangedFilePreview,
  shouldAutoExpandChangedFiles,
  shouldPreviewChangedFiles,
} from "@/lib/components/chat/changedFilesPresentation";

function file(path: string): ChangedFile {
  const segments = path.split("/");
  return {
    path,
    name: segments.at(-1) ?? path,
    dir: segments.slice(0, -1).join("/"),
  };
}

describe("changed files presentation", () => {
  it("expands only small latest-turn summaries", () => {
    const small = [file("apps/web/a.ts"), file("packages/ui/b.ts")];
    const large = Array.from({ length: 6 }, (_, index) =>
      file(`apps/web/${index}.ts`),
    );

    expect(shouldAutoExpandChangedFiles(small, true)).toBe(true);
    expect(shouldAutoExpandChangedFiles(small, false)).toBe(false);
    expect(shouldAutoExpandChangedFiles(large, true)).toBe(false);
    expect(shouldPreviewChangedFiles(small, true)).toBe(false);
    expect(shouldPreviewChangedFiles(large, true)).toBe(true);
    expect(shouldPreviewChangedFiles(large, false)).toBe(false);
  });

  it("previews distinct top-level scopes before filling remaining slots", () => {
    const files = [
      file("/tmp/repo/apps/web/a.ts"),
      file("/tmp/repo/apps/web/b.ts"),
      file("/tmp/repo/packages/ui/c.ts"),
      file("/tmp/repo/docs/d.md"),
    ];

    expect(selectChangedFilePreview(files).map((entry) => entry.path)).toEqual([
      "/tmp/repo/apps/web/a.ts",
      "/tmp/repo/packages/ui/c.ts",
      "/tmp/repo/docs/d.md",
    ]);
  });
});
