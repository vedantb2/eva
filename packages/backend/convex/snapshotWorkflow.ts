import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { isTerminalSnapshotState } from "./_daytona/snapshotStates";

const POLL_DELAY_MS = 30_000;
const MAX_POLLS = 60; // ~30 minutes at 30s intervals

// Detached seed-run poll loop (per app). The whole per-app pipeline (git
// update, deps/build, daemons, seed, clean stop) runs as ONE detached script on
// the sandbox (launchSeedRun) so no Convex action ever waits on a slow command
// — cold docker pulls or readiness waits can take as long as they need. The
// workflow just polls the script's outcome markers.
const SEED_RUN_POLL_DELAY_MS = 20_000;
const MAX_SEED_RUN_POLLS = 150; // ~50 minutes at 20s intervals

// Seeded-snapshot capture poll loop (per app). The capture is triggered
// without blocking (triggerSeededSnapshot) then polled here across separate
// steps, so a long DB-volume capture never exceeds Convex's 600s per-action
// ceiling. We poll the snapshot entity until it reaches "active" (success) or a
// failure state — see pollSeededSnapshotState for why the sandbox state is not
// a reliable completion signal.
const SEED_SNAPSHOT_POLL_DELAY_MS = 15_000;
const MAX_SEED_SNAPSHOT_POLLS = 240; // ~60 minutes at 15s intervals — captures
// normally finish in ~6m but have been observed taking 40m+ when the Daytona
// builder/runner fleet is degraded; the window must outlast a bad day because
// exhausting it costs the app its seeded refresh for this build.

/**
 * Snapshot build workflow — sandbox-native model.
 *
 * Each app's snapshot is refreshed INSIDE a sandbox booted from its previous
 * seeded snapshot (warm: toolchain, service docker images, node_modules and
 * local backends all present), rather than via a separate declarative Image
 * build:
 *
 *   per app, in parallel:
 *     1. boot a sandbox from the app's previous seeded snapshot
 *        (fallback: the base Image snapshot when no seeded exists yet)
 *     2. fetch latest refs (fetchBaseBranch owns git auth)
 *     3. run ONE detached script: git reset to the build branch → repo build
 *        commands (fresh deps/artifacts) → launch background daemons → seed
 *        commands → marker → clean stop; the workflow polls its markers
 *     4. capture a versioned snapshot (seeded-<repoId>-<buildId>), poll to
 *        active, swap the repo pointer, then delete the previous snapshot
 *        (keep-last-good: a failure at any point leaves the old snapshot live)
 *
 * Everything a sandbox boot needs is refreshed every build — code, deps, build
 * artifacts, seeded data — with no separate Image rebuild (~11-15m serial, and
 * observed 2-4x slower when captures ran concurrently against Daytona's
 * builder). The declarative Image build remains ONLY as the bootstrap /
 * toolchain-change path, behind forceImageRebuild (run it when an app has no
 * seeded snapshot yet, or buildSnapshotImage's tool layers change).
 */
export const snapshotBuildWorkflow = workflow.define({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoSnapshotId: v.id("repoSnapshots"),
    // Rebuild the declarative base Image first (bootstrap / toolchain
    // changes). The nightly cron and Rebuild Now leave this unset.
    forceImageRebuild: v.optional(v.boolean()),
    // Operational bootstrap path: seed app snapshots from the base Image
    // instead of their previous seeded snapshots. Use once when a seeded app
    // snapshot is too stale to boot its local services cleanly.
    forceBaseSeed: v.optional(v.boolean()),
  },
  handler: async (step, args) => {
    // Resolve config + repo (owner/name/installation drive git fetch auth).
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
    const repo = await step.runQuery(internal.repoSnapshots.getRepo, {
      repoId: config.repoId,
    });
    if (!repo) {
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error: "GitHub repo not found",
      });
      return;
    }
    const branch = config.workflowRef ?? "main";

    const apps = await step.runQuery(
      internal.repoSnapshots.getSeedableAppRepos,
      { repoSnapshotId: args.repoSnapshotId },
    );

    try {
      await step.runAction(internal.snapshotActions.sweepSeedPrepSandboxes, {
        repoId: config.repoId,
        scopedRepoIds: apps.map((app) => app.repoId),
        buildId: args.buildId,
      });
    } catch (e) {
      await step.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: `[seed-prep sweep] skipped after error: ${e instanceof Error ? e.message : String(e)}\n`,
      });
    }

    // Best-effort cleanup: delete seeded snapshots for siblings that are no
    // longer seedable (e.g. dropped stopCommands) and clear their stale name.
    // The per-app chains below only manage snapshots for CURRENTLY seedable
    // apps, so without this an ex-seedable app's seeded-<repoId> would linger
    // in Daytona forever. A failed cleanup must not fail the build.
    const orphans = await step.runQuery(
      internal.repoSnapshots.getOrphanedSeededApps,
      { repoSnapshotId: args.repoSnapshotId },
    );
    for (const orphan of orphans) {
      try {
        await step.runAction(internal.snapshotActions.deleteDaytonaSnapshot, {
          snapshotName: orphan.seededSnapshotName,
          repoId: orphan.repoId,
        });
        await step.runMutation(internal.repoSnapshots.setSeededSnapshotName, {
          repoId: orphan.repoId,
          seededSnapshotName: null,
        });
        console.log(
          `[snapshot] cleaned up orphaned seeded snapshot ${orphan.seededSnapshotName} (repo ${orphan.repoId} no longer seedable)`,
        );
      } catch (e) {
        console.error(
          `[snapshot] failed to clean up orphaned seeded snapshot ${orphan.seededSnapshotName}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // Bootstrap / toolchain path: rebuild the declarative base Image first
    // (serial — captures contending with the Image builder slow both down).
    if (args.forceImageRebuild) {
      await step.runAction(internal.snapshotActions.deleteExistingSnapshot, {
        snapshotName: config.snapshotName,
        repoId: config.repoId,
        buildId: args.buildId,
      });
      const kickOffResult = await step.runAction(
        internal.snapshotActions.kickOffSnapshotBuild,
        { buildId: args.buildId, repoSnapshotId: args.repoSnapshotId },
      );
      // Kick-off failure already recorded completeBuild(error).
      if (!kickOffResult) return;
      let attempt = 0;
      let state = "";
      while (attempt < MAX_POLLS) {
        attempt++;
        state = await step.runAction(
          internal.snapshotActions.pollSnapshotProgress,
          {
            buildId: args.buildId,
            snapshotName: kickOffResult.snapshotName,
            repoId: kickOffResult.repoId,
            attempt,
          },
          { runAfter: attempt === 1 ? 10_000 : POLL_DELAY_MS },
        );
        if (isTerminalSnapshotState(state)) break;
      }
      if (state !== "active") {
        // pollSnapshotProgress recorded the error terminal states; timeouts
        // need recording here. Either way there is no bootable image to seed
        // from, so stop.
        if (!isTerminalSnapshotState(state)) {
          await step.runMutation(internal.repoSnapshots.completeBuild, {
            buildId: args.buildId,
            status: "error",
            logs: `Max poll attempts (${MAX_POLLS}) reached.\n`,
            error:
              "Snapshot build did not complete within polling window (~30 minutes)",
          });
        }
        return;
      }
    } else {
      await step.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: args.forceBaseSeed
          ? `Sandbox-native build: updating + reseeding ${apps.length} app(s) from the base Image (branch: ${branch}).\n`
          : `Sandbox-native build: updating + reseeding ${apps.length} app(s) from their previous seeded snapshots (branch: ${branch}).\n`,
      });
    }

    // Whether the base Image exists (fallback boot source for apps that have
    // no seeded snapshot yet).
    const imageState = await step.runAction(
      internal.snapshotActions.pollSeededSnapshotState,
      { repoId: config.repoId, seededName: config.snapshotName },
    );

    // Per-app pipeline. Versioned capture name (buildId is unique per build):
    // the previous seeded snapshot stays LIVE and untouched until the
    // replacement is active, so a failed build never costs an app its warm
    // snapshot — sandboxes keep booting from the old one and the next build
    // warm-boots from it. Only after a successful swap is the old snapshot
    // deleted (keep-last-good).
    const runSeedChain = async (
      app: (typeof apps)[number],
    ): Promise<boolean> => {
      const seededName = `seeded-${app.repoId}-${args.buildId}`;
      let prepSandboxId: string | null = null;
      try {
        // Mark this app as actively seeding so the UI shows a spinner until
        // it resolves to seeded/fallback below.
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "running",
          seededSnapshotName: null,
        });
        // Boot source cascade: previous seeded snapshot (warm: toolchain +
        // service images + deps all present) → base Image (bootstrap). The
        // retry/backoff absorbs runner propagation lag on fresh snapshots.
        const sources = [
          ...(app.seededSnapshotName && args.forceBaseSeed !== true
            ? [app.seededSnapshotName]
            : []),
          ...(imageState === "active" ? [config.snapshotName] : []),
        ];
        if (sources.length === 0) {
          throw new Error(
            `No boot source for ${app.repoId}: no previous seeded snapshot and no base Image — run forceImageRebuild to bootstrap`,
          );
        }
        for (const source of sources) {
          try {
            const created = await step.runAction(
              internal.snapshotActions.createSeedPrepSandbox,
              { repoId: app.repoId, imageSnapshot: source },
              { retry: { maxAttempts: 4, initialBackoffMs: 15000, base: 2 } },
            );
            prepSandboxId = created.sandboxId;
            console.log(
              `[snapshot] booted seed sandbox for ${app.repoId} from ${source}`,
            );
            break;
          } catch (e) {
            console.error(
              `[snapshot] boot from ${source} failed for ${app.repoId}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
        if (!prepSandboxId) {
          throw new Error(
            `Could not boot a seed sandbox for ${app.repoId} from any source`,
          );
        }
        // Fresh refs for the detached script's hard reset (owns git auth).
        await step.runAction(
          internal.daytona.fetchBaseBranch,
          {
            sandboxId: prepSandboxId,
            installationId: repo.installationId,
            repoOwner: repo.owner,
            repoName: repo.name,
            baseBranch: branch,
            repoId: app.repoId,
          },
          { retry: { maxAttempts: 3, initialBackoffMs: 10000, base: 2 } },
        );
        // Launch the whole pipeline detached; poll its outcome markers. The
        // launch is idempotent (live-process guard), so retries can't race a
        // second copy of the script.
        await step.runAction(
          internal.snapshotActions.launchSeedRun,
          {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
            branch,
            buildCommands: config.buildCommands ?? [],
          },
          { retry: { maxAttempts: 3, initialBackoffMs: 10000, base: 2 } },
        );
        let seedState = "running";
        for (
          let pollAttempt = 1;
          pollAttempt <= MAX_SEED_RUN_POLLS && seedState === "running";
          pollAttempt++
        ) {
          seedState = await step.runAction(
            internal.snapshotActions.pollSeedRun,
            { sandboxId: prepSandboxId, repoId: app.repoId },
            { runAfter: SEED_RUN_POLL_DELAY_MS },
          );
        }
        if (seedState !== "done") {
          // Grab the seed-run + daemon logs into the build record BEFORE the
          // catch tears the sandbox down — teardown destroys the evidence.
          const diagnostics = await step.runAction(
            internal.snapshotActions.fetchSeedDiagnostics,
            { sandboxId: prepSandboxId, repoId: app.repoId },
          );
          await step.runMutation(internal.repoSnapshots.appendLogs, {
            buildId: args.buildId,
            chunk: `[seed ${app.repoId}] FAILED (${seedState}) — diagnostics:\n${diagnostics}\n`,
          });
          throw new Error(
            `Seed run for ${app.repoId} did not complete (state: ${seedState})`,
          );
        }
        // Capture the refreshed filesystem snapshot. Trigger fires the POST
        // without blocking; poll across separate steps so a long DB capture
        // never exceeds Convex's 600s per-action ceiling.
        // triggerSeededSnapshot returns the provider's actual snapshot id:
        // - Daytona: equals seededName (the Daytona snapshot name IS its id)
        // - Vercel: a generated `snap_*` id distinct from seededName
        // All subsequent steps must use effectiveSeededName so that the right
        // id is polled and written to seededSnapshotName on the repo.
        const { snapshotId: effectiveSeededName } = await step.runAction(
          internal.snapshotActions.triggerSeededSnapshot,
          { repoId: app.repoId, sandboxId: prepSandboxId, seededName },
        );
        let snapState = "pending";
        for (
          let pollAttempt = 1;
          pollAttempt <= MAX_SEED_SNAPSHOT_POLLS &&
          !isTerminalSnapshotState(snapState);
          pollAttempt++
        ) {
          snapState = await step.runAction(
            internal.snapshotActions.pollSeededSnapshotState,
            { repoId: app.repoId, seededName: effectiveSeededName },
            {
              runAfter:
                pollAttempt === 1 ? 10_000 : SEED_SNAPSHOT_POLL_DELAY_MS,
            },
          );
        }
        if (snapState !== "active") {
          throw new Error(
            `Seeded snapshot for ${app.repoId} did not reach active (last state: ${snapState})`,
          );
        }
        await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
          sandboxId: prepSandboxId,
          repoId: app.repoId,
        });
        prepSandboxId = null;
        // SWAP: point the repo at the new snapshot, then (best-effort) delete
        // the previous one. New sandboxes cut over atomically; a failed delete
        // just leaves a stray snapshot that the next successful build removes.
        await step.runMutation(internal.repoSnapshots.setSeededSnapshotName, {
          repoId: app.repoId,
          seededSnapshotName: effectiveSeededName,
        });
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "seeded",
          seededSnapshotName: effectiveSeededName,
        });
        try {
          await step.runMutation(
            internal.repoSnapshots.updateSeededAppWarmupStatus,
            {
              buildId: args.buildId,
              repoId: app.repoId,
              status: "pending",
            },
          );
          await step.runAction(
            internal.snapshotActions.warmSeededSnapshotCache,
            {
              buildId: args.buildId,
              repoId: app.repoId,
              seededName: effectiveSeededName,
            },
          );
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          await step.runMutation(
            internal.repoSnapshots.updateSeededAppWarmupStatus,
            {
              buildId: args.buildId,
              repoId: app.repoId,
              status: "error",
              error: message,
            },
          );
          await step.runMutation(internal.repoSnapshots.appendLogs, {
            buildId: args.buildId,
            chunk: `[warm ${app.repoId}] skipped after error: ${message}\n`,
          });
        }
        if (
          app.seededSnapshotName &&
          app.seededSnapshotName !== effectiveSeededName
        ) {
          try {
            await step.runAction(
              internal.snapshotActions.deleteDaytonaSnapshot,
              {
                snapshotName: app.seededSnapshotName,
                repoId: app.repoId,
              },
            );
          } catch (e) {
            console.error(
              `[snapshot] failed to delete previous seeded snapshot ${app.seededSnapshotName}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
        return true;
      } catch (e) {
        console.error(
          `[snapshot] seeded build failed for ${app.repoId}: ${e instanceof Error ? e.message : String(e)}`,
        );
        // Tear down the prep sandbox so it doesn't linger.
        if (prepSandboxId) {
          await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
            sandboxId: prepSandboxId,
            repoId: app.repoId,
          });
        }
        // Best-effort: remove the partial/orphaned versioned capture if the
        // trigger fired before the failure (no-op when it never registered).
        try {
          await step.runAction(internal.snapshotActions.deleteDaytonaSnapshot, {
            snapshotName: seededName,
            repoId: app.repoId,
          });
        } catch {
          // ignore — snapshot may not exist
        }
        // The repo keeps its PREVIOUS seededSnapshotName (untouched above), so
        // sandboxes continue booting from the last good seeded snapshot.
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "fallback",
          seededSnapshotName: app.seededSnapshotName,
        });
        return false;
      }
    };

    const results = await Promise.all(apps.map((app) => runSeedChain(app)));

    // Finalize the build record (the forceImageRebuild path already recorded
    // the image outcome; per-app outcomes live in seededApps either way).
    if (!args.forceImageRebuild) {
      const succeeded = results.filter(Boolean).length;
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: succeeded === apps.length ? "success" : "error",
        logs: `Sandbox-native build finished: ${succeeded}/${apps.length} app snapshot(s) refreshed.\n`,
        ...(succeeded === apps.length
          ? {}
          : {
              error: `${apps.length - succeeded} app snapshot(s) fell back to their previous seeded snapshot — see per-app diagnostics in the logs`,
            }),
      });
    }
  },
});
