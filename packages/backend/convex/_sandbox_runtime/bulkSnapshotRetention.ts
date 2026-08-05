"use node";

import { v } from "convex/values";
import { Snapshot } from "@vercel/sandbox";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { resolveSandboxCredentialsOnly } from "../envVarResolver";
import { getSandboxHandle, ensureSandboxRunning } from "./helpers";
import { unwrapVercelSandbox } from "../_sandbox/vercelProvider";
import {
  KEEP_LAST_SNAPSHOTS,
  SNAPSHOT_TTL_MS,
} from "../_sandbox/vercelSnapshotOptions";

function snapshotStillExpiring(expiresAt: number | null | undefined): boolean {
  if (expiresAt === null || expiresAt === undefined) return false;
  // Vercel may report ms epoch or seconds; treat far-future 0-ish as none.
  if (expiresAt === 0) return false;
  return true;
}

/**
 * One-off pass: PATCH live sandboxes to never-expire retention, then read
 * snapshot `expiresAt` back to learn whether the update is retroactive.
 *
 * First run with defaults (cycleIfNeeded false). If logs show still-expiring,
 * re-run with `{ cycleIfNeeded: true }` to mint a fresh snap under the new policy.
 *
 *   npx convex run sandbox:bulkUpdateSnapshotRetention
 *   npx convex run sandbox:bulkUpdateSnapshotRetention '{"cycleIfNeeded":true}'
 */
export const bulkUpdateSnapshotRetention = internalAction({
  args: {
    cursor: v.optional(v.string()),
    phase: v.optional(
      v.union(
        v.literal("sessions"),
        v.literal("projects"),
        v.literal("agentTasks"),
      ),
    ),
    cycleIfNeeded: v.optional(v.boolean()),
    cleared: v.optional(v.number()),
    stillExpiring: v.optional(v.number()),
    skipped: v.optional(v.number()),
    cycled: v.optional(v.number()),
  },
  returns: v.object({
    cleared: v.number(),
    stillExpiring: v.number(),
    skipped: v.number(),
    cycled: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const cycleIfNeeded = args.cycleIfNeeded === true;
    let cleared = args.cleared ?? 0;
    let stillExpiring = args.stillExpiring ?? 0;
    let skipped = args.skipped ?? 0;
    let cycled = args.cycled ?? 0;

    const page = await ctx.runQuery(
      internal.sandboxCleanup.listLiveSandboxCandidates,
      {
        cursor: args.cursor,
        phase: args.phase,
      },
    );

    for (const candidate of page.candidates) {
      try {
        const credentials = await resolveSandboxCredentialsOnly(
          ctx,
          candidate.repoId,
        );
        const handle = await getSandboxHandle(
          ctx,
          candidate.repoId,
          candidate.sandboxId,
        );
        try {
          await handle.refresh();
        } catch (refreshErr) {
          skipped += 1;
          console.log(
            `[bulkUpdateSnapshotRetention] skip gone ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`,
          );
          continue;
        }
        if (handle.state === "gone" || handle.state === "error") {
          skipped += 1;
          console.log(
            `[bulkUpdateSnapshotRetention] skip state=${handle.state} ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}`,
          );
          continue;
        }

        const vercel = unwrapVercelSandbox(handle);
        await vercel.update({
          snapshotExpiration: SNAPSHOT_TTL_MS,
          keepLastSnapshots: KEEP_LAST_SNAPSHOTS,
        });

        let anyExpiring = false;
        const listed = await Snapshot.list({
          token: credentials.token,
          teamId: credentials.teamId,
          name: vercel.name,
        });
        for await (const meta of listed) {
          const expiresAt =
            "expiresAt" in meta && typeof meta.expiresAt === "number"
              ? meta.expiresAt
              : null;
          if (snapshotStillExpiring(expiresAt)) {
            anyExpiring = true;
          }
        }

        if (!anyExpiring) {
          cleared += 1;
          console.log(
            `[bulkUpdateSnapshotRetention] retroactive: cleared ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}`,
          );
          continue;
        }

        stillExpiring += 1;
        console.log(
          `[bulkUpdateSnapshotRetention] still-expiring ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}`,
        );

        if (!cycleIfNeeded) continue;

        // Mint a fresh snapshot under the new policy; keep-last-1 evicts old.
        await ensureSandboxRunning(handle, {
          timeoutSeconds: 120,
          resumeAfterStop: true,
        });
        await handle.stop();
        cycled += 1;
        console.log(
          `[bulkUpdateSnapshotRetention] cycled ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}`,
        );
      } catch (err) {
        skipped += 1;
        console.warn(
          `[bulkUpdateSnapshotRetention] failed ${candidate.kind}=${candidate.entityId} sandbox=${candidate.sandboxId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!page.isDone && page.nextPhase !== null) {
      await ctx.scheduler.runAfter(
        0,
        internal.sandbox.bulkUpdateSnapshotRetention,
        {
          cursor:
            page.nextPhase === page.phase
              ? (page.continueCursor ?? undefined)
              : undefined,
          phase: page.nextPhase,
          cycleIfNeeded,
          cleared,
          stillExpiring,
          skipped,
          cycled,
        },
      );
      return { cleared, stillExpiring, skipped, cycled, done: false };
    }

    console.log(
      `[bulkUpdateSnapshotRetention] done cleared=${cleared} stillExpiring=${stillExpiring} skipped=${skipped} cycled=${cycled} cycleIfNeeded=${cycleIfNeeded}`,
    );
    return { cleared, stillExpiring, skipped, cycled, done: true };
  },
});
