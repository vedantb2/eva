import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { quote } from "shell-quote";
import type {
  SandboxExecResult,
  SandboxHandle,
} from "../convex/_sandbox/provider";
import { workspaceDirShell } from "../convex/_sandbox_runtime/helpers";
import { pushBranchToOrigin } from "../convex/_sandbox_runtime/git";
import {
  publishErrorNeedsForcePush,
  REWRITE_REMOTE_ONLY_FILE_THRESHOLD,
} from "../convex/_sandbox_runtime/divergedPublish";

/**
 * Task m57dve3m (evalucom/carepulse-ts, 2 Sep 2026): the agent rebased its
 * eva/task-… branch onto a new base, so the sandbox branch and origin shared
 * no recent history. Publish refused ("532 remote-only files vs 1 local"), the
 * refusal bubbled out of agentTaskChatWorkflow, and the task could not update
 * its PR — even though GitHub only held the sandbox's own old tip.
 *
 * These run the real publish protocol against real git repositories: a bare
 * "GitHub" and a working clone standing in for the sandbox. The fake handle
 * runs each command locally, pointing the workspace and the remote URL at the
 * temp repositories.
 */

const OWNER = "evalucom";
const REPO = "carepulse-ts";
const BRANCH = "eva/task-rewrite";
const REMOTE_URL = `https://github.com/${OWNER}/${REPO}.git`;

let root: string;
let origin: string;
let sandboxRepo: string;

const gitEnv = {
  ...process.env,
  HOME: undefined,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_TERMINAL_PROMPT: "0",
  GIT_AUTHOR_NAME: "eva-test",
  GIT_AUTHOR_EMAIL: "eva-test@example.com",
  GIT_COMMITTER_NAME: "eva-test",
  GIT_COMMITTER_EMAIL: "eva-test@example.com",
};

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    env: gitEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function commitFiles(cwd: string, subject: string, files: string[]): string {
  for (const file of files) {
    mkdirSync(join(cwd, file, ".."), { recursive: true });
    writeFileSync(join(cwd, file), `${subject}\n`);
  }
  git(cwd, "add", "-A");
  git(cwd, "commit", "-q", "-m", subject);
  return git(cwd, "rev-parse", "HEAD");
}

/** Runs the sandbox's shell commands against the temp clone. */
function sandboxHandle(): SandboxHandle {
  const outOfScope = (member: string): never => {
    throw new Error(`fake sandbox: ${member} is out of scope for this test`);
  };
  return {
    id: "sbx-rewritten-publish",
    state: "running",
    errorReason: null,
    classifyForReconcile: () => Promise.resolve("alive"),
    exec: (cmd: string): Promise<SandboxExecResult> => {
      // The commands quote the URL the way git.ts does, so match that form.
      const local = cmd
        .replaceAll(workspaceDirShell(), quote([sandboxRepo]))
        .replaceAll(quote([REMOTE_URL]), quote([origin]));
      try {
        const output = execFileSync("bash", ["-c", local], {
          env: gitEnv,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
        return Promise.resolve({ exitCode: 0, output });
      } catch (error) {
        const failure =
          error instanceof Error &&
          "status" in error &&
          typeof error.status === "number" &&
          "stderr" in error &&
          typeof error.stderr === "string" &&
          "stdout" in error &&
          typeof error.stdout === "string"
            ? {
                exitCode: error.status,
                output: `${error.stdout}${error.stderr}`,
              }
            : { exitCode: 1, output: String(error) };
        return Promise.resolve(failure);
      }
    },
    refresh: () => outOfScope("refresh"),
    stop: () => outOfScope("stop"),
    start: () => outOfScope("start"),
    writeFile: () => outOfScope("writeFile"),
    execDetached: () => outOfScope("execDetached"),
    archive: () => outOfScope("archive"),
    extendTimeout: () => outOfScope("extendTimeout"),
    delete: () => outOfScope("delete"),
    previewUrl: () => outOfScope("previewUrl"),
    createSnapshot: () => outOfScope("createSnapshot"),
    git: {
      branches: () => outOfScope("git.branches"),
      clone: () => outOfScope("git.clone"),
      checkoutBranch: () => outOfScope("git.checkoutBranch"),
    },
  };
}

/**
 * main ← staging (many files) ← eva/task-rewrite (one file), all on origin.
 * The sandbox then rebases the task branch from staging onto main, which is
 * the shape the rewrite classifier keys on: one local file against a large
 * remote-only tree. Returns the old (still published) tip.
 */
function seedRewrittenBranch(): { oldTip: string; rewrittenTip: string } {
  const seed = join(root, "seed");
  mkdirSync(seed);
  git(seed, "init", "-q", "-b", "main");
  commitFiles(seed, "base", ["README.md"]);
  git(seed, "checkout", "-q", "-b", "staging");
  commitFiles(
    seed,
    "staging work",
    Array.from(
      { length: REWRITE_REMOTE_ONLY_FILE_THRESHOLD + 5 },
      (_, i) => `apps/web/staging-${i}.ts`,
    ),
  );
  git(seed, "remote", "add", "origin", origin);
  git(seed, "push", "-q", "origin", "main", "staging");

  git(sandboxRepo, "fetch", "-q", "origin");
  git(sandboxRepo, "checkout", "-q", "-b", BRANCH, "origin/staging");
  const oldTip = commitFiles(sandboxRepo, "task: feature", [
    "apps/web/feature.tsx",
  ]);
  git(sandboxRepo, "push", "-q", "-u", "origin", BRANCH);
  expect(git(sandboxRepo, "diff", "--name-only", "origin/main", BRANCH).split("\n").length)
    .toBeGreaterThan(REWRITE_REMOTE_ONLY_FILE_THRESHOLD);

  git(sandboxRepo, "rebase", "-q", "--onto", "origin/main", "origin/staging", BRANCH);
  const rewrittenTip = git(sandboxRepo, "rev-parse", "HEAD");
  expect(rewrittenTip).not.toBe(oldTip);
  expect(git(origin, "rev-parse", `refs/heads/${BRANCH}`)).toBe(oldTip);
  return { oldTip, rewrittenTip };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "eva-rewritten-publish-"));
  origin = join(root, "origin.git");
  sandboxRepo = join(root, "sandbox");
  git(root, "init", "-q", "--bare", origin);
  git(root, "clone", "-q", origin, sandboxRepo);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("publishing a rewritten eva/ branch", () => {
  test("replaces origin when the remote tip is the sandbox's own old tip", async () => {
    const { rewrittenTip } = seedRewrittenBranch();

    const result = await pushBranchToOrigin(sandboxHandle(), OWNER, REPO, BRANCH);

    expect(result).toEqual({ pushed: true, published: true });
    expect(git(origin, "rev-parse", `refs/heads/${BRANCH}`)).toBe(rewrittenTip);
    // The old history was never merged back in; the branch is exactly the rebase.
    expect(git(sandboxRepo, "rev-parse", "HEAD")).toBe(rewrittenTip);
    expect(git(sandboxRepo, "rev-list", "--count", "origin/main..HEAD")).toBe("1");
  });

  test("refuses, and says why, when origin holds commits the sandbox never had", async () => {
    const { oldTip, rewrittenTip } = seedRewrittenBranch();
    // A reviewer pushes to the PR branch from their own clone after the
    // sandbox last saw it.
    const reviewer = join(root, "reviewer");
    git(root, "clone", "-q", "--branch", BRANCH, origin, reviewer);
    const reviewerTip = commitFiles(reviewer, "reviewer: fix typo", [
      "apps/web/typo.tsx",
    ]);
    git(reviewer, "push", "-q", "origin", BRANCH);
    expect(reviewerTip).not.toBe(oldTip);

    await expect(
      pushBranchToOrigin(sandboxHandle(), OWNER, REPO, BRANCH),
    ).rejects.toThrow("holds commits this sandbox never had");
    try {
      await pushBranchToOrigin(sandboxHandle(), OWNER, REPO, BRANCH);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // The web recovery banner keys on this wording.
      expect(publishErrorNeedsForcePush(message)).toBe(true);
      expect(message).toContain(`git push --force-with-lease origin ${BRANCH}`);
    }
    // Nothing moved on either side.
    expect(git(origin, "rev-parse", `refs/heads/${BRANCH}`)).toBe(reviewerTip);
    expect(git(sandboxRepo, "rev-parse", "HEAD")).toBe(rewrittenTip);
    expect(git(sandboxRepo, "status", "--porcelain")).toBe("");
  });

  test("a rewritten branch Eva does not own is never force-pushed", async () => {
    seedRewrittenBranch();
    const shared = "release/2026-09";
    git(sandboxRepo, "branch", "-m", BRANCH, shared);
    git(sandboxRepo, "branch", "-u", `origin/${BRANCH}`, shared);
    // Origin has the branch under its shared name, at the old history.
    git(origin, "update-ref", `refs/heads/${shared}`, `refs/heads/${BRANCH}`);
    git(sandboxRepo, "fetch", "-q", "origin", shared);
    const originTip = git(origin, "rev-parse", `refs/heads/${shared}`);

    await expect(
      pushBranchToOrigin(sandboxHandle(), OWNER, REPO, shared),
    ).rejects.toThrow(`${shared} is not one`);
    expect(git(origin, "rev-parse", `refs/heads/${shared}`)).toBe(originTip);
  });

  test("a lease rejection re-syncs instead of overwriting a commit that landed mid-publish", async () => {
    // Pinned indirectly: the second sync sees the reviewer's tip, which is not
    // in the reflog, so the retry refuses rather than forcing.
    const { oldTip } = seedRewrittenBranch();
    const handle = sandboxHandle();
    const reviewer = join(root, "reviewer");
    git(root, "clone", "-q", "--branch", BRANCH, origin, reviewer);
    let interposed = false;
    const racing: SandboxHandle = {
      ...handle,
      exec: (cmd, opts) => {
        if (!interposed && cmd.includes("git push")) {
          interposed = true;
          commitFiles(reviewer, "reviewer: landed first", ["apps/web/raced.tsx"]);
          git(reviewer, "push", "-q", "origin", BRANCH);
        }
        return handle.exec(cmd, opts);
      },
    };

    await expect(
      pushBranchToOrigin(racing, OWNER, REPO, BRANCH, { retryAttempts: 2 }),
    ).rejects.toThrow("holds commits this sandbox never had");
    expect(interposed).toBe(true);
    const originTip = git(origin, "rev-parse", `refs/heads/${BRANCH}`);
    expect(originTip).not.toBe(oldTip);
    expect(git(origin, "log", "-1", "--format=%s", originTip)).toBe(
      "reviewer: landed first",
    );
  });
});
