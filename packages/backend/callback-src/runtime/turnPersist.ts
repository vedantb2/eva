import { spawnSync } from "child_process";
import { REQUIRE_TASK_COMMIT, RUN_ID, WORK_DIR } from "../config.js";
import { log } from "../utils.js";

const GIT_STEP_TIMEOUT_MS = 20_000;
const PUSH_TIMEOUT_MS = 60_000;

// Media exclusions mirror the agent-facing commit convention in
// convex/_sessions/prompts.ts — captures are chat deliverables, never commits.
const COMMIT_ADD_ARGS = [
  "add",
  "-A",
  "--",
  ":!*.png",
  ":!*.jpg",
  ":!*.jpeg",
  ":!*.gif",
  ":!*.webp",
  ":!*.webm",
  ":!*.mp4",
  ":!*.mov",
  ":!screenshots/",
  ":!recordings/",
];

function git(
  args: string[],
  timeoutMs: number = GIT_STEP_TIMEOUT_MS,
): { ok: boolean; out: string } {
  const result = spawnSync("git", ["-C", WORK_DIR, ...args], {
    encoding: "utf8",
    timeout: timeoutMs,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  const out = ((result.stdout || "") + (result.stderr || "")).trim();
  return { ok: result.status === 0, out };
}

/**
 * Makes the turn's work durable BEFORE the completion mutation is posted:
 * commits any uncommitted changes (safety net for agents that skipped the
 * prompt's commit convention) and pushes unpushed commits to origin.
 *
 * Why here and not the workflow's post-completion push step: the sandbox VM
 * can die at any moment (provider runtime cap, OOM, platform stop) and a hard
 * death takes no snapshot — the next resume rolls the filesystem back to the
 * pre-turn snapshot. Anything not on origin at that moment is erased. Session
 * 53 and task 213 (6 Aug 2026) both lost completed turns to exactly that
 * window. Once this has run, "turn completed" implies "work is on origin".
 *
 * Deliberately skipped for task runs (RUN_ID / REQUIRE_TASK_COMMIT): the run
 * workflow owns commit semantics there — the commit gate must keep failing
 * agents that did not commit, and the run's own push/PR steps follow.
 * Only ever acts on eva-owned branches (`eva/…`); never main or a base branch.
 * Best-effort throughout: failure must never fail the turn.
 */
export function persistTurnWork(): void {
  if (REQUIRE_TASK_COMMIT || RUN_ID) return;
  const startedAt = Date.now();

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!branch.ok || !branch.out.startsWith("eva/")) {
    if (branch.ok && branch.out) {
      log(`persistTurnWork: skipped — branch "${branch.out}" is not eva-owned`);
    }
    return;
  }

  const dirty = git(["status", "--porcelain"]);
  if (dirty.ok && dirty.out.length > 0) {
    git(COMMIT_ADD_ARGS);
    const staged = git(["diff", "--cached", "--quiet"]);
    if (!staged.ok) {
      const commit = git([
        "commit",
        "-m",
        "task: checkpoint uncommitted work at turn end",
      ]);
      log(
        `persistTurnWork: auto-commit ${commit.ok ? "created" : "failed: " + commit.out.slice(0, 200)}`,
      );
    }
  }

  // Ahead-of-remote gate (mirrors pushBranchToOrigin): chat-only turns have
  // nothing to publish and their push would create the remote branch. Fail
  // open — durability is the point, so an unreadable count still pushes.
  const unpushed = git([
    "rev-list",
    "--count",
    "HEAD",
    "--not",
    "--remotes=origin",
  ]);
  if (unpushed.ok && unpushed.out === "0") return;

  // Fully-qualified refspec, both sides. `HEAD` resolves through whatever the
  // branch currently points at and a bare name goes through the upstream, so
  // either could aim at the base branch; this names the exact ref to update and
  // cannot resolve anywhere else.
  const refspec = `refs/heads/${branch.out}:refs/heads/${branch.out}`;
  const push = git(["push", "origin", refspec], PUSH_TIMEOUT_MS);
  log(
    `persistTurnWork: push ${push.ok ? "ok" : "failed: " + push.out.slice(0, 200)} branch=${branch.out} in ${Date.now() - startedAt}ms`,
  );
}
