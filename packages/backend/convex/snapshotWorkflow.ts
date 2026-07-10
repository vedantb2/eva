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
 * Snapshot build workflow — SINGLE whole-repo seeded snapshot model.
 *
 * Instead of one seeded snapshot per app, the whole monorepo is captured into
 * ONE seeded snapshot on a single fresh sandbox: clone → install toolchain +
 * deps → start the shared stack (Supabase + Convex) → seed → capture ONE
 * `snap_*` → write it to every seedable app repo's seededSnapshotName. Any
 * app then boots from the same snapshot (its code/deps are present; if it
 * owns its own Convex, that cold-starts on first use).
 *
 *   1. resolve the PRIMARY seed app (getPrimarySeedAppRepo) — the seedable
 *      app whose commands require Supabase capture (owns start-db/supabase/
 *      seed:sql), falling back to the first seedable app
 *   2. boot ONE fresh seed-prep sandbox from the primary app
 *   3. fetch latest refs (fetchBaseBranch owns git auth)
 *   4. run ONE detached script (launchSeedRun): toolchain + config files
 *      (Vercel only) → git reset → install → daemons → seed commands →
 *      marker → clean stop; the workflow polls its markers
 *   5. capture ONE snapshot, poll to active, write it to every seedable app
 *      repo's seededSnapshotName
 *   6. stop/delete all sandboxes for these repos (best-effort safety net)
 *
 * No warmup step: the first user sandbox created from the new snapshot pays
 * the cold-boot cost directly. The declarative Image build remains ONLY as
 * the bootstrap / toolchain-change path, behind forceImageRebuild.
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

    // Resolve the primary seed app + the full set of seedable app repos that
    // must all end up pointing at the ONE snapshot built below.
    const primary = await step.runQuery(
      internal.repoSnapshots.getPrimarySeedAppRepo,
      { repoSnapshotId: args.repoSnapshotId },
    );
    // Repos with no app stop commands cannot run the seeded-snapshot path; rebuild
    // the declarative base Image instead (same outcome as forceImageRebuild).
    const imageOnlyBuild = primary === null && args.forceImageRebuild !== true;
    const rebuildBaseImage = args.forceImageRebuild === true || imageOnlyBuild;
    if (imageOnlyBuild) {
      await step.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk:
          "No seedable apps configured (add Stop Commands on at least one app repo to enable seeded snapshots). Rebuilding base Image snapshot only.\n",
      });
    }
    const seedableRepoIds = primary?.seedableRepoIds ?? [];

    try {
      await step.runAction(internal.snapshotActions.sweepSeedPrepSandboxes, {
        repoId: config.repoId,
        scopedRepoIds: seedableRepoIds,
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
        await step.runAction(internal.snapshotActions.deleteSeededSnapshot, {
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

    // Bootstrap / toolchain path: rebuild the base Image first
    // (serial — captures contending with the Image builder slow both down).
    if (rebuildBaseImage) {
      const providerKind = await step.runAction(
        internal.daytona.getSandboxProviderKind,
        { repoId: config.repoId },
      );

      if (providerKind === "vercel") {
        const baseSnapshotLabel = `base-${config.repoId}`;
        let prepSandboxId: string | null = null;

        if (config.baseSnapshotId) {
          try {
            await step.runAction(
              internal.snapshotActions.deleteSeededSnapshot,
              {
                snapshotName: config.baseSnapshotId,
                repoId: config.repoId,
              },
            );
          } catch (e) {
            console.error(
              `[snapshot] failed to delete previous Vercel base snapshot ${config.baseSnapshotId}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }

        await step.runMutation(internal.repoSnapshots.appendLogs, {
          buildId: args.buildId,
          chunk:
            "Vercel base Image build: fresh sandbox → toolchain + pnpm install + build commands → snap_* capture...\n",
        });

        try {
          const created = await step.runAction(
            internal.snapshotActions.createSeedPrepSandbox,
            { repoId: config.repoId, imageSnapshot: config.snapshotName },
            { retry: { maxAttempts: 4, initialBackoffMs: 15000, base: 2 } },
          );
          prepSandboxId = created.sandboxId;

          await step.runAction(
            internal.daytona.fetchBaseBranch,
            {
              sandboxId: prepSandboxId,
              installationId: repo.installationId,
              repoOwner: repo.owner,
              repoName: repo.name,
              baseBranch: branch,
              repoId: config.repoId,
            },
            { retry: { maxAttempts: 3, initialBackoffMs: 10000, base: 2 } },
          );

          await step.runAction(
            internal.snapshotActions.launchSeedRun,
            {
              sandboxId: prepSandboxId,
              repoId: config.repoId,
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
              { sandboxId: prepSandboxId, repoId: config.repoId },
              { runAfter: SEED_RUN_POLL_DELAY_MS },
            );
          }
          if (seedState !== "done") {
            const diagnostics = await step.runAction(
              internal.snapshotActions.fetchSeedDiagnostics,
              { sandboxId: prepSandboxId, repoId: config.repoId },
            );
            await step.runMutation(internal.repoSnapshots.appendLogs, {
              buildId: args.buildId,
              chunk: `[Vercel base image] prep FAILED (${seedState}) — diagnostics:\n${diagnostics}\n`,
            });
            await step.runAction(
              internal.snapshotActions.deleteSeedPrepSandbox,
              { sandboxId: prepSandboxId, repoId: config.repoId },
            );
            prepSandboxId = null;
            await step.runMutation(internal.repoSnapshots.completeBuild, {
              buildId: args.buildId,
              status: "error",
              logs: "",
              error: `Vercel base Image prep did not complete (state: ${seedState}) — see logs for diagnostics`,
            });
            return;
          }

          const { snapshotId: effectiveBaseId } = await step.runAction(
            internal.snapshotActions.triggerSeededSnapshot,
            {
              repoId: config.repoId,
              sandboxId: prepSandboxId,
              seededName: baseSnapshotLabel,
            },
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
              { repoId: config.repoId, seededName: effectiveBaseId },
              {
                runAfter:
                  pollAttempt === 1 ? 10_000 : SEED_SNAPSHOT_POLL_DELAY_MS,
              },
            );
          }
          if (snapState !== "active") {
            await step.runAction(
              internal.snapshotActions.deleteSeedPrepSandbox,
              { sandboxId: prepSandboxId, repoId: config.repoId },
            );
            prepSandboxId = null;
            await step.runAction(
              internal.snapshotActions.deleteSeededSnapshot,
              {
                snapshotName: effectiveBaseId,
                repoId: config.repoId,
              },
            );
            await step.runMutation(internal.repoSnapshots.completeBuild, {
              buildId: args.buildId,
              status: "error",
              logs: "",
              error: `Vercel base Image did not reach active (last state: ${snapState})`,
            });
            return;
          }

          await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
            sandboxId: prepSandboxId,
            repoId: config.repoId,
          });
          prepSandboxId = null;

          await step.runMutation(internal.repoSnapshots.setBaseSnapshotId, {
            repoSnapshotId: args.repoSnapshotId,
            baseSnapshotId: effectiveBaseId,
          });
          await step.runMutation(internal.repoSnapshots.completeBuild, {
            buildId: args.buildId,
            status: "success",
            logs: `Vercel base Image ${effectiveBaseId} built successfully.\n`,
          });
        } catch (e) {
          if (prepSandboxId) {
            await step.runAction(
              internal.snapshotActions.deleteSeedPrepSandbox,
              {
                sandboxId: prepSandboxId,
                repoId: config.repoId,
              },
            );
          }
          await step.runMutation(internal.repoSnapshots.completeBuild, {
            buildId: args.buildId,
            status: "error",
            logs: "",
            error:
              e instanceof Error
                ? e.message
                : "Vercel base Image build failed unexpectedly",
          });
          return;
        }
      } else {
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
      }
    } else {
      await step.runMutation(internal.repoSnapshots.appendLogs, {
        buildId: args.buildId,
        chunk: `Single seeded snapshot build: updating + reseeding ${seedableRepoIds.length} app(s) from a fresh sandbox (branch: ${branch}).\n`,
      });
    }

    // forceImageRebuild has no seedable apps to chase further (it only
    // refreshes the base Image); the seed flow below needs a primary app.
    if (!primary) return;
    const primaryRepoId = primary.primaryRepoId;

    // Track the previous per-app seeded snapshot names so a failure can log
    // what stays live, and so we can best-effort delete now-orphaned ones
    // once the new snapshot is confirmed active.
    const previousSeededNames = await step.runQuery(
      internal.repoSnapshots.getSeedableAppRepos,
      { repoSnapshotId: args.repoSnapshotId },
    );

    const seededName = `seeded-${primaryRepoId}`;
    let prepSandboxId: string | null = null;
    let deletedExistingSeededSnapshots = false;

    // Marks every seedable app as fallback (keeping its previous snapshot
    // name) and completes the build with an error. Used on every failure exit.
    const failBuild = async (error: string): Promise<void> => {
      for (const app of previousSeededNames) {
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "fallback",
          seededSnapshotName: deletedExistingSeededSnapshots
            ? null
            : app.seededSnapshotName,
        });
      }
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "error",
        logs: "",
        error,
      });
      await step.runAction(internal.snapshotActions.stopAllRepoSandboxes, {
        seedableRepoIds,
      });
    };

    try {
      // Mark every seedable app as actively seeding so the UI shows a
      // spinner until the single build resolves to seeded/fallback below.
      for (const repoId of seedableRepoIds) {
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId,
          status: "running",
          seededSnapshotName: null,
        });
      }

      // One fresh seed-prep sandbox for the whole build (Vercel maps a
      // non-`snap_` source to a fresh sandbox; Daytona would map onto its
      // Image snapshot the same way the old per-app flow did).
      const created = await step.runAction(
        internal.snapshotActions.createSeedPrepSandbox,
        { repoId: primaryRepoId, imageSnapshot: config.snapshotName },
        { retry: { maxAttempts: 4, initialBackoffMs: 15000, base: 2 } },
      );
      prepSandboxId = created.sandboxId;

      // Fresh refs for the detached script's hard reset (owns git auth).
      await step.runAction(
        internal.daytona.fetchBaseBranch,
        {
          sandboxId: prepSandboxId,
          installationId: repo.installationId,
          repoOwner: repo.owner,
          repoName: repo.name,
          baseBranch: branch,
          repoId: primaryRepoId,
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
          repoId: primaryRepoId,
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
          { sandboxId: prepSandboxId, repoId: primaryRepoId },
          { runAfter: SEED_RUN_POLL_DELAY_MS },
        );
      }
      if (seedState !== "done") {
        // Grab the seed-run + daemon logs into the build record BEFORE the
        // sandbox is torn down — teardown destroys the evidence.
        const diagnostics = await step.runAction(
          internal.snapshotActions.fetchSeedDiagnostics,
          { sandboxId: prepSandboxId, repoId: primaryRepoId },
        );
        await step.runMutation(internal.repoSnapshots.appendLogs, {
          buildId: args.buildId,
          chunk: `[seed ${primaryRepoId}] FAILED (${seedState}) — diagnostics:\n${diagnostics}\n`,
        });
        await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
          sandboxId: prepSandboxId,
          repoId: primaryRepoId,
        });
        prepSandboxId = null;
        await failBuild(
          `Seed run did not complete (state: ${seedState}) — see logs for diagnostics`,
        );
        return;
      }

      const previousSeededSnapshotNames: string[] = [];
      for (const app of previousSeededNames) {
        if (
          app.seededSnapshotName &&
          !previousSeededSnapshotNames.includes(app.seededSnapshotName)
        ) {
          previousSeededSnapshotNames.push(app.seededSnapshotName);
        }
      }
      if (previousSeededSnapshotNames.length > 0) {
        await step.runMutation(
          internal.repoSnapshots.setSeededSnapshotNameForAll,
          { repoIds: seedableRepoIds, seededSnapshotName: null },
        );
        for (const snapshotName of previousSeededSnapshotNames) {
          await step.runAction(internal.snapshotActions.deleteSeededSnapshot, {
            snapshotName,
            repoId: primaryRepoId,
          });
        }
        await step.runMutation(internal.repoSnapshots.appendLogs, {
          buildId: args.buildId,
          chunk: `Deleted ${previousSeededSnapshotNames.length} existing seeded snapshot(s) before capture.\n`,
        });
        deletedExistingSeededSnapshots = true;
      }

      // Capture the refreshed filesystem into ONE snapshot. Trigger fires the
      // POST without blocking; poll across separate steps so a long DB
      // capture never exceeds Convex's 600s per-action ceiling.
      // triggerSeededSnapshot returns the provider's actual snapshot id:
      // - Daytona: equals seededName (the Daytona snapshot name IS its id)
      // - Vercel: a generated `snap_*` id distinct from seededName
      // All subsequent steps must use effectiveSeededName so that the right
      // id is polled and written to seededSnapshotName on every app repo.
      const { snapshotId: effectiveSeededName } = await step.runAction(
        internal.snapshotActions.triggerSeededSnapshot,
        { repoId: primaryRepoId, sandboxId: prepSandboxId, seededName },
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
          { repoId: primaryRepoId, seededName: effectiveSeededName },
          {
            runAfter: pollAttempt === 1 ? 10_000 : SEED_SNAPSHOT_POLL_DELAY_MS,
          },
        );
      }
      if (snapState !== "active") {
        await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
          sandboxId: prepSandboxId,
          repoId: primaryRepoId,
        });
        prepSandboxId = null;
        // Best-effort: remove the partial/failed capture so it doesn't linger.
        await step.runAction(internal.snapshotActions.deleteSeededSnapshot, {
          snapshotName: effectiveSeededName,
          repoId: primaryRepoId,
        });
        await failBuild(
          `Seeded snapshot did not reach active (last state: ${snapState})`,
        );
        return;
      }

      await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
        sandboxId: prepSandboxId,
        repoId: primaryRepoId,
      });
      prepSandboxId = null;

      // SWAP: point every seedable app repo at the ONE new snapshot.
      await step.runMutation(
        internal.repoSnapshots.setSeededSnapshotNameForAll,
        { repoIds: seedableRepoIds, seededSnapshotName: effectiveSeededName },
      );
      for (const repoId of seedableRepoIds) {
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId,
          status: "seeded",
          seededSnapshotName: effectiveSeededName,
        });
      }

      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "success",
        logs: `Single seeded snapshot ${effectiveSeededName} built for ${seedableRepoIds.length} app(s).\n`,
      });

      // Best-effort: delete each app's previous snapshot if it differed from
      // the new one (keep-last-good already swapped above, so failures here
      // just leave a stray snapshot that the next successful build removes).
      for (const app of previousSeededNames) {
        if (
          app.seededSnapshotName &&
          app.seededSnapshotName !== effectiveSeededName
        ) {
          try {
            await step.runAction(
              internal.snapshotActions.deleteSeededSnapshot,
              { snapshotName: app.seededSnapshotName, repoId: app.repoId },
            );
          } catch (e) {
            console.error(
              `[snapshot] failed to delete previous seeded snapshot ${app.seededSnapshotName}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
      }

      await step.runAction(internal.snapshotActions.stopAllRepoSandboxes, {
        seedableRepoIds,
      });
    } catch (e) {
      console.error(
        `[snapshot] single seeded build failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      if (prepSandboxId) {
        await step.runAction(internal.snapshotActions.deleteSeedPrepSandbox, {
          sandboxId: prepSandboxId,
          repoId: primaryRepoId,
        });
      }
      await failBuild(e instanceof Error ? e.message : String(e));
    }
  },
});
