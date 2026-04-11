import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";

const POLL_DELAY_MS = 30_000;
const MAX_POLLS = 60; // ~30 minutes at 30s intervals

/** Terminal snapshot states that end the poll loop. */
const TERMINAL_STATES = ["active", "error", "build_failed"];

/**
 * Workflow that orchestrates a full Daytona snapshot build:
 *   0. Delete existing snapshot and wait for removal
 *   1. Kick off the build (non-blocking POST to Daytona API)
 *   2. Poll snapshot state + stream build logs until terminal
 *   3. Complete the build record
 *
 * Each step is a separate action with its own timeout, so builds
 * that take 15–20 minutes don't hit Convex action limits.
 */
export const snapshotBuildWorkflow = workflow.define({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
  },
  handler: async (step, args) => {
    // Step 0: Resolve config to get snapshotName/repoId for the delete step.
    // kickOffSnapshotBuild also resolves config, but we need the names up front.
    const config = await step.runQuery(
      internal.repoSnapshots.getRepoSnapshotInternal,
      { repoSnapshotId: args.repoSnapshotId },
    );
    if (!config) {
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "Snapshot config not found",
      });
      return;
    }

    // Step 1: Delete existing snapshot and wait for removal to finish
    await step.runAction(internal.snapshotActions.deleteExistingSnapshot, {
      snapshotName: config.snapshotName,
      repoId: config.repoId,
      buildId: args.buildId,
    });

    // Step 2: Resolve config, POST to Daytona to start the build
    const kickOffResult = await step.runAction(
      internal.snapshotActions.kickOffSnapshotBuild,
      {
        buildId: args.buildId,
        repoSnapshotId: args.repoSnapshotId,
      },
    );

    // If kick-off failed, it already called completeBuild with error — stop
    if (!kickOffResult) return;

    const { snapshotName, repoId } = kickOffResult;

    // Step 3: Poll snapshot state + stream logs until terminal state
    let attempt = 0;
    let state = "";
    while (attempt < MAX_POLLS) {
      attempt++;

      const pollResult = await step.runAction(
        internal.snapshotActions.pollSnapshotProgress,
        {
          buildId: args.buildId,
          snapshotName,
          repoId,
          attempt,
        },
        { runAfter: attempt === 1 ? 10_000 : POLL_DELAY_MS },
      );

      state = pollResult;

      if (TERMINAL_STATES.includes(state)) break;
    }

    // Step 4: Finalize — if we exhausted polls without terminal state, mark timeout
    if (!TERMINAL_STATES.includes(state)) {
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: `Max poll attempts (${MAX_POLLS}) reached.\n`,
        error:
          "Snapshot build did not complete within polling window (~30 minutes)",
      });
    }
  },
});
