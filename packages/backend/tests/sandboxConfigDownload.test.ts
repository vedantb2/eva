import { describe, expect, test } from "vitest";
import {
  buildConfigFileDownloadCommands,
  filterDownloadableConfigFiles,
} from "../convex/_sandbox_runtime/helpers";

/**
 * Config files are the sandbox's uploaded secrets and database dumps, and the
 * dumps run to hundreds of megabytes. Those transfers died mid-stream on
 * HTTP/2 with `curl: (92) stream not closed cleanly: INTERNAL_ERROR` — a
 * protocol error, which `--retry` does not cover, so the seed inherited a
 * truncated file rather than a retry (fix fc6f5a58).
 */
describe("buildConfigFileDownloadCommands", () => {
  const curlLines = (commands: string[]) =>
    commands.filter((command) => command.startsWith("curl "));

  test("a single-chunk download stays on HTTP/1.1 with the wider retry budget", () => {
    const commands = buildConfigFileDownloadCommands(
      { fileName: "dump.sql", chunkUrls: ["https://blob/one"] },
      "/tmp/repo",
    );
    expect(commands).toEqual([
      "curl -fSL --http1.1 --retry 5 --retry-delay 5 -o '/tmp/repo/dump.sql' 'https://blob/one'",
    ]);
  });

  test("every chunk of a multi-chunk download carries the same options", () => {
    const commands = buildConfigFileDownloadCommands({
      fileName: "dump.sql",
      chunkUrls: ["https://blob/a", "https://blob/b", "https://blob/c"],
    });
    const curls = curlLines(commands);
    expect(curls).toHaveLength(3);
    for (const curl of curls) {
      expect(curl, "an HTTP/2 chunk download can die mid-transfer").toContain(
        "--http1.1",
      );
      expect(curl).toContain("--retry 5");
    }
  });

  test("chunks are concatenated in order and only then removed", () => {
    const commands = buildConfigFileDownloadCommands(
      { fileName: "dump.sql", chunkUrls: ["https://blob/a", "https://blob/b"] },
      "/tmp/repo/",
    );
    expect(commands.at(-2)).toBe(
      "cat '/tmp/dump.sql.chunk-0' '/tmp/dump.sql.chunk-1' > '/tmp/repo/dump.sql'",
    );
    expect(commands.at(-1)).toBe(
      "rm '/tmp/dump.sql.chunk-0' '/tmp/dump.sql.chunk-1'",
    );
  });
});

/** A file assembled from a partial chunk set is corrupt, not incomplete. */
describe("filterDownloadableConfigFiles", () => {
  test("drops any file with a chunk URL the caller could not sign", () => {
    expect(
      filterDownloadableConfigFiles([
        { fileName: "good.sql", chunkUrls: ["https://blob/a"] },
        { fileName: "partial.sql", chunkUrls: ["https://blob/a", null] },
        { fileName: "empty.sql", chunkUrls: [] },
      ]),
    ).toEqual([{ fileName: "good.sql", chunkUrls: ["https://blob/a"] }]);
  });
});
