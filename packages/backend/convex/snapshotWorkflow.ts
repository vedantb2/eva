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

    // Step 5: Per-app seeded snapshots (best-effort). Only once the base Image is
    // active. For each app repo with stopCommands, boot a sandbox from the Image,
    // bring services up, run the one-time seed, clean-stop so volumes flush, then
    // capture a filesystem snapshot with the DB baked in. A sandbox for that app
    // then boots from `seeded-<repoId>` (see getRepoSnapshotName) and skips the
    // ~10-min seed. Failures fall back to the Image (seededSnapshotName left clear).
    if (state === "active") {
      const apps = await step.runQuery(
        internal.repoSnapshots.getSeedableAppRepos,
        { repoSnapshotId: args.repoSnapshotId },
      );
      for (const app of apps) {
        const seededName = `seeded-${app.repoId}`;
        let prepSandboxId: string | null = null;
        try {
          // Clear first so live sandboxes fall back to the Image during rebuild.
          await step.runMutation(internal.repoSnapshots.setSeededSnapshotName, {
            repoId: app.repoId,
            seededSnapshotName: null,
          });
          // Delete the previous seeded snapshot (name reuse would 409).
          await step.runAction(internal.snapshotActions.deleteDaytonaSnapshot, {
            snapshotName: seededName,
            repoId: app.repoId,
          });
          // Retry with backoff: creating the prep sandbox can transiently hit
          // Daytona "No available runners" when the Image build + per-app prep
          // sandboxes contend for capacity. Backoff (15s/30s/60s/120s) rides out
          // a brief saturation; if it still fails, the catch below falls back to
          // the Image for this app.
          const created = await step.runAction(
            internal.snapshotActions.createSeedPrepSandbox,
            { repoId: app.repoId, imageSnapshot: config.snapshotName },
            { retry: { maxAttempts: 5, initialBackoffMs: 15000, base: 2 } },
          );
          prepSandboxId = created.sandboxId;
          // services (every-start) -> one-time seed -> clean stop
          await step.runAction(internal.daytona.runBackgroundCommands, {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
          });
          await step.runAction(internal.daytona.runStartupCommands, {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
          });
          await step.runAction(internal.daytona.runStopCommands, {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
          });
          await step.runAction(internal.snapshotActions.createSeededSnapshot, {
            repoId: app.repoId,
            sandboxId: prepSandboxId,
            seededName,
          });
          await step.runAction(internal.daytona.deleteSandbox, {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
          });
          prepSandboxId = null;
          await step.runMutation(internal.repoSnapshots.setSeededSnapshotName, {
            repoId: app.repoId,
            seededSnapshotName: seededName,
          });
        } catch (e) {
          console.error(
            `[snapshot] seeded build failed for ${app.repoId}: ${e instanceof Error ? e.message : String(e)}`,
          );
          // Tear down the prep sandbox so it doesn't linger.
          if (prepSandboxId) {
            await step.runAction(internal.daytona.deleteSandbox, {
              sandboxId: prepSandboxId,
              repoId: app.repoId,
            });
          }
          // seededSnapshotName stays cleared → app uses the base Image snapshot.
        }
      }
    }
  },
});
