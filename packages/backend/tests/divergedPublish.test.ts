import { describe, expect, test } from "vitest";
import {
  divergedPublishLooksLikeRewrite,
  parseGitNameOnlyList,
  remoteOnlyChangedFileCount,
  REWRITE_REMOTE_ONLY_FILE_THRESHOLD,
} from "../convex/_sandbox_runtime/divergedPublish";

describe("parseGitNameOnlyList", () => {
  test("splits trimmed paths and drops empty lines", () => {
    expect(
      parseGitNameOnlyList("apps/web/a.tsx\n\npnpm-lock.yaml\n"),
    ).toEqual(["apps/web/a.tsx", "pnpm-lock.yaml"]);
  });
});

describe("divergedPublishLooksLikeRewrite", () => {
  test("a handful of remote-only files is concurrent work, not a rewrite", () => {
    expect(
      divergedPublishLooksLikeRewrite(
        ["apps/web/a.tsx"],
        ["apps/web/a.tsx", "apps/web/b.tsx"],
      ),
    ).toBe(false);
  });

  test("the task 231 shape — one local file vs a huge remote unique tree — is a rewrite", () => {
    const remote = Array.from(
      { length: REWRITE_REMOTE_ONLY_FILE_THRESHOLD + 5 },
      (_, i) => `apps/eprocurement/file-${i}.ts`,
    );
    expect(
      divergedPublishLooksLikeRewrite(
        ["apps/web/app/(commissioner)/care_homes/map/CHMapPage.tsx"],
        remote,
      ),
    ).toBe(true);
    expect(remoteOnlyChangedFileCount(["local.ts"], remote)).toBe(remote.length);
  });
});
