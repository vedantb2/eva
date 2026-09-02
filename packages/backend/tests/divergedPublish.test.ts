import { describe, expect, test } from "vitest";
import {
  divergedPublishLooksLikeRewrite,
  isEvaOwnedBranch,
  parseGitNameOnlyList,
  publishErrorNeedsForcePush,
  remoteOnlyChangedFileCount,
  rewrittenBranchIsOwnHistory,
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
    const raw = rewrittenBranchPublishError(
      "eva/session-abc",
      290,
      220,
      "remote-holds-foreign-commits",
    );
    expect(publishErrorNeedsForcePush(raw)).toBe(true);
    expect(
      publishErrorNeedsForcePush(
        rewrittenBranchPublishError("feature/x", 290, 220, "branch-not-eva-owned"),
      ),
    ).toBe(true);
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

describe("rewrittenBranchPublishError", () => {
  test("tells the reader why Eva did not force-push and what to do", () => {
    const foreign = rewrittenBranchPublishError(
      "eva/task-abc",
      532,
      1,
      "remote-holds-foreign-commits",
    );
    expect(foreign).toContain("532 remote-only files vs 1 local");
    expect(foreign).toContain("commits this sandbox never had");
    expect(foreign).toContain("git push --force-with-lease origin eva/task-abc");
    const unowned = rewrittenBranchPublishError(
      "release/1.2",
      532,
      1,
      "branch-not-eva-owned",
    );
    expect(unowned).toContain("release/1.2 is not one");
  });
});

describe("isEvaOwnedBranch", () => {
  test("only eva/ branches may ever be rewritten on GitHub", () => {
    expect(isEvaOwnedBranch("eva/task-abc")).toBe(true);
    expect(isEvaOwnedBranch("eva/session-abc")).toBe(true);
    expect(isEvaOwnedBranch("main")).toBe(false);
    expect(isEvaOwnedBranch("staging")).toBe(false);
    expect(isEvaOwnedBranch("feature/eva/x")).toBe(false);
  });
});

describe("rewrittenBranchIsOwnHistory", () => {
  const oldTip = "a".repeat(40);
  const rewrittenTip = "b".repeat(40);
  const foreignTip = "c".repeat(40);

  test("the remote tip the local branch once pointed at is the sandbox's own history", () => {
    // reflog show --format=%H lists the newest entry first.
    expect(
      rewrittenBranchIsOwnHistory(`${oldTip}\n`, [rewrittenTip, oldTip]),
    ).toBe(true);
  });

  test("a remote tip the branch never held was pushed by someone else", () => {
    expect(
      rewrittenBranchIsOwnHistory(foreignTip, [rewrittenTip, oldTip]),
    ).toBe(false);
  });

  test("no reflog or no tip means refuse, not guess", () => {
    expect(rewrittenBranchIsOwnHistory(oldTip, [])).toBe(false);
    expect(rewrittenBranchIsOwnHistory("", [oldTip])).toBe(false);
  });
});
