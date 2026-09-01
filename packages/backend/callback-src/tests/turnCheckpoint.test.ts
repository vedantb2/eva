import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { JsonObject } from "../types.js";
import type * as callbackConfig from "../config.js";

// A throwaway repo stands in for the sandbox workspace so the checkpoint reads
// real shas without touching this checkout.
const workspace = vi.hoisted(() => {
  return { dir: "" };
});

vi.mock("../config.js", async (importOriginal) => {
  const original = await importOriginal<typeof callbackConfig>();
  return {
    ...original,
    RUN_ID: null,
    get WORK_DIR() {
      return workspace.dir;
    },
  };
});

const { appendTurnCheckpoint, beginTurnCheckpoint, resetTurnCheckpoint } =
  await import("../runtime/turnCheckpoint.js");

function git(args: string[]): string {
  const result = spawnSync("git", ["-C", workspace.dir, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@t",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@t",
    },
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function commit(message: string): string {
  writeFileSync(join(workspace.dir, "file.txt"), message);
  git(["add", "file.txt"]);
  git(["commit", "-q", "-m", message]);
  return git(["rev-parse", "HEAD"]);
}

beforeEach(() => {
  workspace.dir = mkdtempSync(join(tmpdir(), "turn-checkpoint-"));
  git(["init", "-q", "-b", "eva/session-test"]);
});

afterEach(() => {
  resetTurnCheckpoint();
});

describe("appendTurnCheckpoint", () => {
  test("stamps the turn-start sha and the post-persist HEAD", () => {
    const before = commit("start");
    beginTurnCheckpoint();
    const after = commit("turn work");
    const args: JsonObject = {};
    appendTurnCheckpoint(args);
    expect(args).toEqual({ beforeSha: before, afterSha: after });
  });

  test("equal shas when the turn changed nothing", () => {
    const head = commit("start");
    beginTurnCheckpoint();
    const args: JsonObject = {};
    appendTurnCheckpoint(args);
    expect(args).toEqual({ beforeSha: head, afterSha: head });
  });

  test("skips turns that never began a checkpoint", () => {
    commit("start");
    const args: JsonObject = {};
    appendTurnCheckpoint(args);
    expect(args).toEqual({});
  });

  test("skips non-eva branches", () => {
    commit("start");
    git(["checkout", "-q", "-b", "main"]);
    beginTurnCheckpoint();
    const args: JsonObject = {};
    appendTurnCheckpoint(args);
    expect(args).toEqual({});
  });
});
