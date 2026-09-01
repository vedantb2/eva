import { spawnSync } from "child_process";
import { RUN_ID, WORK_DIR } from "../config.js";
import type { JsonObject } from "../types.js";
import { readGitHeadSha } from "../utils.js";

/**
 * Turn checkpoint: the sandbox HEAD when a turn started and after
 * persistTurnWork committed/pushed at its end. Both shas ride on the completion
 * mutation (optional args, so old bundles and new servers stay compatible) and
 * land on the assistant message, where "Diff this turn" and "Restore to before
 * this turn" read them. Pushed commits are the only durable store — the VM
 * filesystem is not — so no hidden refs are kept.
 */
let turnStartSha = "";

/** Records HEAD at turn start. Call once per turn, before the provider runs. */
export function beginTurnCheckpoint(): void {
  turnStartSha = readGitHeadSha();
}

export function resetTurnCheckpoint(): void {
  turnStartSha = "";
}

function currentBranch(): string {
  const result = spawnSync(
    "git",
    ["-C", WORK_DIR, "rev-parse", "--abbrev-ref", "HEAD"],
    { encoding: "utf8", timeout: 20_000 },
  );
  return result.status === 0 ? (result.stdout || "").trim() : "";
}

/**
 * Stamps `beforeSha`/`afterSha` onto a completion payload. Must run AFTER
 * `persistTurnWork()` so `afterSha` includes the turn-end auto-commit. Skipped
 * for task runs and non-eva branches, mirroring persistTurnWork: those turns
 * have no session-owned commits to diff or restore.
 */
export function appendTurnCheckpoint(args: JsonObject): void {
  if (RUN_ID || turnStartSha === "") return;
  if (!currentBranch().startsWith("eva/")) return;
  const afterSha = readGitHeadSha();
  if (afterSha === "") return;
  args.beforeSha = turnStartSha;
  args.afterSha = afterSha;
}
