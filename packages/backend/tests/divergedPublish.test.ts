import { describe, expect, test } from "vitest";
import {
  divergedPublishLooksLikeRewrite,
  parseGitNameOnlyList,
  publishErrorNeedsForcePush,
  remoteOnlyChangedFileCount,
  rewrittenBranchPublishError,
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

describe("publishErrorNeedsForcePush", () => {
  test("matches the rewritten-branch refusal, including the workflow's prefixed form", () => {
    const raw = rewrittenBranchPublishError("eva/session-abc", 290, 220);
    expect(publishErrorNeedsForcePush(raw)).toBe(true);
    // sessionWorkflow prefixes the git error before storing it as errorDetail.
    expect(
      publishErrorNeedsForcePush(
        `Session completed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${raw}`,
      ),
    ).toBe(true);
  });

  test("does not match ambiguous diverged-publish failures where force-push could destroy work", () => {
    expect(
      publishErrorNeedsForcePush(
        "Could not merge origin/eva/session-abc into the local branch. The sandbox was left clean — there are no conflict markers to resolve. If you rewrote history, force-push; if both sides committed, merge the remote branch in the sandbox and retry.",
      ),
    ).toBe(false);
    expect(publishErrorNeedsForcePush("pushBranchToOrigin exhausted retries")).toBe(
      false,
    );
  });
});
