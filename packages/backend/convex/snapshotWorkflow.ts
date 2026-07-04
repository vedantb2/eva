import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { isTerminalSnapshotState } from "./_daytona/snapshotStates";

const POLL_DELAY_MS = 30_000;
const MAX_POLLS = 60; // ~30 minutes at 30s intervals

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
 * Workflow that orchestrates a full Daytona snapshot build:
 *   0. Resolve config + seedable apps; clean up orphaned seeded snapshots
 *   1. Pre-create per-app seed-prep sandboxes from the CURRENT (old) image —
 *      seeding does not need the new image (the DB data is identical and
 *      sandboxes fetch fresh branches on boot), so booting from the old,
 *      already-propagated image lets seeding run CONCURRENTLY with the image
 *      rebuild instead of serially after it. This turned a ~35min build
 *      (image → propagation probe → seed → capture, all serial) back into
 *      ~max(image, seed+capture) ≈ the old ~15min image-only time.
 *   2. Delete the existing image snapshot and kick off the rebuild
 *   3. CONCURRENTLY: poll the image build to completion AND run each app's
 *      seed → clean-stop → capture chain on its pre-created sandbox
 *
 * Fallback: when no bootable current image exists (first build, or the app's
 * pre-create failed), the app's chain waits for the NEW image to become active
 * and creates its prep sandbox from that, with retry/backoff absorbing
 * propagation lag — no separate probe needed.
 *
 * Each step is a separate action with its own timeout, so builds that take
 * 15–20 minutes don't hit Convex action limits.
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

    const apps = await step.runQuery(
      internal.repoSnapshots.getSeedableAppRepos,
      { repoSnapshotId: args.repoSnapshotId },
    );

    // Best-effort cleanup: delete seeded snapshots for siblings that are no
    // longer seedable (e.g. dropped stopCommands) and clear their stale name.
    // The per-app chains below only delete snapshots for CURRENTLY seedable
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

    // Step 1: Pre-create seed-prep sandboxes from the CURRENT image, before it
    // is deleted for the rebuild. The old image is already propagated to
    // runners, so creates succeed immediately (no probe / propagation wait).
    // A miss (no current image, or create failure) leaves null — that app's
    // chain falls back to waiting for the new image below.
    const currentImageState = await step.runAction(
      internal.snapshotActions.pollSeededSnapshotState,
      { repoId: config.repoId, seededName: config.snapshotName },
    );

    // Fingerprint the Image inputs (lockfile sha, build commands, config-file
    // blobs, image definition version). When unchanged since the last
    // successful build AND the current image is active, the rebuild is skipped
    // entirely — its output would be byte-identical, and the ~11-15m rebuild
    // was the dominant cost of every no-op nightly build. null (inputs
    // undeterminable) always rebuilds.
    const imageFingerprint = await step.runAction(
      internal.snapshotActions.getImageFingerprint,
      { repoSnapshotId: args.repoSnapshotId },
    );
    const imageUnchanged =
      imageFingerprint !== null &&
      config.imageFingerprint === imageFingerprint &&
      currentImageState === "active";
    // Fingerprint the seed inputs per app. When unchanged since the last
    // successful capture AND that snapshot still exists, the app is SKIPPED
    // outright: re-seeding identical data only produces an identical snapshot
    // while its capture contends with the concurrent image build (observed
    // slowing Daytona image builds 2-4x). Most builds skip both apps and cost
    // exactly the image time.
    const fingerprints: string[] = await Promise.all(
      apps.map((app) =>
        step.runQuery(internal.repoSnapshots.getSeedFingerprint, {
          repoSnapshotId: args.repoSnapshotId,
          repoId: app.repoId,
        }),
      ),
    );
    const skipApp: boolean[] = await Promise.all(
      apps.map(async (app, i) => {
        if (!app.seededSnapshotName) return false;
        if (app.seededFingerprint !== fingerprints[i]) return false;
        // Fingerprint matches — confirm the snapshot actually exists/active.
        const state = await step.runAction(
          internal.snapshotActions.pollSeededSnapshotState,
          { repoId: app.repoId, seededName: app.seededSnapshotName },
        );
        return state === "active";
      }),
    );

    const prepSandboxIds: Array<string | null> = await Promise.all(
      apps.map(async (app, i) => {
        if (skipApp[i]) return null;
        // Prefer booting from the app's PREVIOUS seeded snapshot over the bare
        // image: it already contains the pulled service docker images (supabase
        // ~1-2GB) and the convex local backend, skipping a 4-8 min cold-pull
        // tax on every rebuild. Fresh data still lands because seed:sql resets
        // the DB and convex import runs --replace-all. Cascade: previous seeded
        // snapshot → current image → (in the chain) the new image.
        const sources = [
          ...(app.seededSnapshotName ? [app.seededSnapshotName] : []),
          ...(currentImageState === "active" ? [config.snapshotName] : []),
        ];
        for (const source of sources) {
          try {
            const created = await step.runAction(
              internal.snapshotActions.createSeedPrepSandbox,
              { repoId: app.repoId, imageSnapshot: source },
              { retry: { maxAttempts: 2, initialBackoffMs: 10000, base: 2 } },
            );
            console.log(
              `[snapshot] pre-created seed sandbox for ${app.repoId} from ${source}`,
            );
            return created.sandboxId;
          } catch (e) {
            console.error(
              `[snapshot] pre-create from ${source} failed for ${app.repoId}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
        return null;
      }),
    );

    let snapshotName = config.snapshotName;
    let repoId = config.repoId;
    if (imageUnchanged) {
      // Image inputs unchanged — keep the existing active image as this
      // build's result and mark the build successful immediately.
      console.log(
        `[snapshot] image inputs unchanged — keeping ${config.snapshotName}`,
      );
      await step.runMutation(internal.repoSnapshots.completeBuild, {
        buildId: args.buildId,
        status: "success",
        logs: `Image inputs unchanged (fingerprint match) — kept existing snapshot ${config.snapshotName}.\n`,
      });
    } else {
      // Step 2: Delete existing snapshot and wait for removal to finish
      await step.runAction(internal.snapshotActions.deleteExistingSnapshot, {
        snapshotName: config.snapshotName,
        repoId: config.repoId,
        buildId: args.buildId,
      });

      // Step 3: Resolve config, POST to Daytona to start the build
      const kickOffResult = await step.runAction(
        internal.snapshotActions.kickOffSnapshotBuild,
        {
          buildId: args.buildId,
          repoSnapshotId: args.repoSnapshotId,
        },
      );

      // If kick-off failed, it already called completeBuild with error — stop.
      // Tear down any pre-created prep sandboxes so they don't linger.
      if (!kickOffResult) {
        for (let i = 0; i < apps.length; i++) {
          const sandboxId = prepSandboxIds[i];
          if (sandboxId) {
            await step.runAction(internal.daytona.deleteSandbox, {
              sandboxId,
              repoId: apps[i].repoId,
            });
          }
        }
        return;
      }

      snapshotName = kickOffResult.snapshotName;
      repoId = kickOffResult.repoId;
    }

    // Image poll loop: poll snapshot state + stream logs until terminal state,
    // then finalize the build record. Runs CONCURRENTLY with the seed chains.
    const pollImageBuild = async (): Promise<void> => {
      let attempt = 0;
      let state = "";
      while (attempt < MAX_POLLS) {
        attempt++;
        state = await step.runAction(
          internal.snapshotActions.pollSnapshotProgress,
          {
            buildId: args.buildId,
            snapshotName,
            repoId,
            attempt,
          },
          { runAfter: attempt === 1 ? 10_000 : POLL_DELAY_MS },
        );
        if (isTerminalSnapshotState(state)) break;
      }
      if (!isTerminalSnapshotState(state)) {
        await step.runMutation(internal.repoSnapshots.completeBuild, {
          buildId: args.buildId,
          status: "error",
          logs: `Max poll attempts (${MAX_POLLS}) reached.\n`,
          error:
            "Snapshot build did not complete within polling window (~30 minutes)",
        });
      }
      // Remember the inputs this image was built from so the next build can
      // skip when they are unchanged.
      if (state === "active" && imageFingerprint !== null) {
        await step.runMutation(internal.repoSnapshots.setImageFingerprint, {
          repoSnapshotId: args.repoSnapshotId,
          imageFingerprint,
        });
      }
    };

    // Per-app seeded snapshot chain (best-effort). Boot a sandbox (pre-created
    // from the old image, or created from the new image once active), bring
    // services up, run the one-time seed, clean-stop so volumes flush, then
    // capture a filesystem snapshot with the DB baked in. A sandbox for that
    // app then boots from `seeded-<repoId>` (see getRepoSnapshotName) and skips
    // the ~10-min seed. Failures fall back to the Image (seededSnapshotName
    // left clear).
    const runSeedChain = async (
      app: (typeof apps)[number],
      preCreatedSandboxId: string | null,
      fingerprint: string,
      skip: boolean,
    ): Promise<void> => {
      // Inputs unchanged + snapshot verified active → keep the existing seeded
      // snapshot as this build's result. Costs seconds instead of ~11 minutes.
      if (skip && app.seededSnapshotName) {
        console.log(
          `[snapshot] seed inputs unchanged for ${app.repoId} — keeping ${app.seededSnapshotName}`,
        );
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "seeded",
          seededSnapshotName: app.seededSnapshotName,
        });
        return;
      }
      // Versioned capture name (buildId is unique per build): the previous
      // seeded snapshot stays LIVE and untouched until the replacement is
      // active, so a failed build never costs an app its warm snapshot —
      // sandboxes keep booting from the old one and the next build warm-boots
      // its prep sandbox from it. Only after a successful swap is the old
      // snapshot deleted (keep-last-good).
      const seededName = `seeded-${app.repoId}-${args.buildId}`;
      let prepSandboxId: string | null = preCreatedSandboxId;
      try {
        // Mark this app as actively seeding so the UI shows a spinner until
        // it resolves to seeded/fallback below.
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "running",
          seededSnapshotName: null,
        });
        // Fallback path: no pre-created sandbox (first build, or pre-create
        // failed). Wait for the NEW image to become active, then create from
        // it — the retry/backoff absorbs runner propagation lag.
        if (!prepSandboxId) {
          let imageState = "pending";
          for (
            let pollAttempt = 1;
            pollAttempt <= MAX_POLLS && !isTerminalSnapshotState(imageState);
            pollAttempt++
          ) {
            imageState = await step.runAction(
              internal.snapshotActions.pollSeededSnapshotState,
              { repoId: app.repoId, seededName: snapshotName },
              { runAfter: pollAttempt === 1 ? 10_000 : POLL_DELAY_MS },
            );
          }
          if (imageState !== "active") {
            throw new Error(
              `Base image never became active (last state: ${imageState}) — cannot seed ${app.repoId}`,
            );
          }
          const created = await step.runAction(
            internal.snapshotActions.createSeedPrepSandbox,
            { repoId: app.repoId, imageSnapshot: snapshotName },
            { retry: { maxAttempts: 5, initialBackoffMs: 15000, base: 2 } },
          );
          prepSandboxId = created.sandboxId;
        }
        // services (every-start, launched detached in one quick action)
        await step.runAction(internal.daytona.runBackgroundCommands, {
          sandboxId: prepSandboxId,
          repoId: app.repoId,
        });
        // Seed: run each command as its OWN workflow step. A single action
        // running the whole seed (readiness wait + many env sets + import) can
        // overrun Convex's ~10-min action limit; per-command steps each get
        // their own budget. Any failure throws -> caught below -> Image fallback
        // (we never snapshot a half-seeded DB).
        const seedCommands = await step.runQuery(
          internal.repoSnapshots.getStartupCommands,
          { repoId: app.repoId },
        );
        for (const command of seedCommands ?? []) {
          // Retry generously: a cold prep sandbox pulls service docker
          // images on first boot (supabase ~1-2GB), so a readiness-wait
          // command can overrun its step budget while pulls are in flight —
          // observed on prod taking >15 min on a cache-cold runner. The
          // detached background daemons keep pulling between attempts, so
          // 4 attempts (~30 min of wait budget) rides out any cold pull.
          await step.runAction(
            internal.daytona.runSandboxCommand,
            {
              sandboxId: prepSandboxId,
              repoId: app.repoId,
              command,
              timeoutSeconds: 540,
            },
            { retry: { maxAttempts: 4, initialBackoffMs: 5000, base: 2 } },
          );
        }
        // Marker so a sandbox booting from the seeded snapshot skips the seed.
        await step.runAction(internal.daytona.runSandboxCommand, {
          sandboxId: prepSandboxId,
          repoId: app.repoId,
          command: "touch /tmp/.startup-commands-done",
          timeoutSeconds: 10,
        });
        // clean stop so volumes flush before the snapshot
        await step.runAction(internal.daytona.runStopCommands, {
          sandboxId: prepSandboxId,
          repoId: app.repoId,
        });
        // Capture the seeded filesystem snapshot. Trigger fires the POST
        // without blocking; poll across separate steps so a long DB capture
        // never exceeds Convex's 600s per-action ceiling.
        await step.runAction(internal.snapshotActions.triggerSeededSnapshot, {
          repoId: app.repoId,
          sandboxId: prepSandboxId,
          seededName,
        });
        let snapState = "pending";
        for (
          let pollAttempt = 1;
          pollAttempt <= MAX_SEED_SNAPSHOT_POLLS &&
          !isTerminalSnapshotState(snapState);
          pollAttempt++
        ) {
          snapState = await step.runAction(
            internal.snapshotActions.pollSeededSnapshotState,
            { repoId: app.repoId, seededName },
            {
              runAfter:
                pollAttempt === 1 ? 10_000 : SEED_SNAPSHOT_POLL_DELAY_MS,
            },
          );
        }
        // Anything but "active" (failure state or window exhausted) throws
        // into the per-app catch below → prep sandbox torn down + fallback
        // (null) recorded → app keeps the base-Image snapshot.
        if (snapState !== "active") {
          throw new Error(
            `Seeded snapshot for ${app.repoId} did not reach active (last state: ${snapState})`,
          );
        }
        await step.runAction(internal.daytona.deleteSandbox, {
          sandboxId: prepSandboxId,
          repoId: app.repoId,
        });
        prepSandboxId = null;
        // SWAP: point the repo at the new snapshot, then (best-effort) delete
        // the previous one. New sandboxes cut over atomically; a failed delete
        // just leaves a stray snapshot that the next successful build removes.
        await step.runMutation(internal.repoSnapshots.setSeededSnapshotName, {
          repoId: app.repoId,
          seededSnapshotName: seededName,
          seededFingerprint: fingerprint,
        });
        // Record the success on the build record for the history view.
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "seeded",
          seededSnapshotName: seededName,
        });
        if (app.seededSnapshotName && app.seededSnapshotName !== seededName) {
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
        // sandboxes continue booting from the last good seeded snapshot. Record
        // the fallback on the build record for the history view.
        await step.runMutation(internal.repoSnapshots.recordSeededApp, {
          buildId: args.buildId,
          repoId: app.repoId,
          status: "fallback",
          seededSnapshotName: app.seededSnapshotName,
        });
      }
    };

    // Step 4: Image poll + all apps' seed chains run CONCURRENTLY. Each chain
    // is independent and catches its own errors, so one app's failure never
    // affects the image build or its sibling.
    await Promise.all([
      ...(imageUnchanged ? [] : [pollImageBuild()]),
      ...apps.map((app, i) =>
        runSeedChain(app, prepSandboxIds[i], fingerprints[i], skipApp[i]),
      ),
    ]);
  },
});
