import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";

/**
 * Rebuilds a repo snapshot by snapshotting a warmed Experimental sandbox.
 *
 * Each major phase runs as a separate workflow action, avoiding the 15-minute
 * Convex action timeout for long-running builds.
 */
export const snapshotBuildWorkflow = workflow.define({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
  },
  handler: async (step, args) => {
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

    // Step 0: Delete existing snapshot
    await step.runAction(internal.snapshotActions.deleteExistingSnapshot, {
      snapshotName: config.snapshotName,
      repoId: config.repoId,
      buildId: args.buildId,
    });

    const statusAfterDelete = await step.runQuery(
      internal.repoSnapshots.getBuildStatus,
      { buildId: args.buildId },
    );
    if (statusAfterDelete !== "running") {
      return;
    }

    // Step 1: Create builder sandbox
    const builderResult = await step.runAction(
      internal.snapshotActions.createBuilderSandbox,
      {
        buildId: args.buildId,
        repoSnapshotId: args.repoSnapshotId,
      },
    );
    if (!builderResult) return;

    const { sandboxId, snapshotName, repoId, branch, startupCommands } =
      builderResult;

    // Step 2: Install platform toolchain
    const toolchainOk = await step.runAction(
      internal.snapshotActions.installToolchain,
      {
        buildId: args.buildId,
        sandboxId,
        repoId,
      },
    );
    if (!toolchainOk) return;

    // Step 3: Clone repo and install dependencies
    const cloneOk = await step.runAction(
      internal.snapshotActions.cloneRepoAndInstallDeps,
      {
        buildId: args.buildId,
        sandboxId,
        repoId,
        branch,
      },
    );
    if (!cloneOk) return;

    // Step 4: Run startup commands
    const startupOk = await step.runAction(
      internal.snapshotActions.runStartupCommands,
      {
        buildId: args.buildId,
        sandboxId,
        repoId,
        startupCommands,
      },
    );
    if (!startupOk) return;

    // Step 5: Create snapshot and cleanup
    await step.runAction(internal.snapshotActions.finalizeSnapshot, {
      buildId: args.buildId,
      sandboxId,
      repoId,
      snapshotName,
    });
  },
});
