import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * One-off backfill: links historical change-request re-runs to the comment that
 * triggered them. Before `pendingChangeRequestCommentId` existed, project-task
 * re-runs (started by Build Project) never recorded `triggeringCommentId`, so
 * the timeline showed "success" instead of "made changes". This sets that link
 * for a known set of (run, comment) pairs.
 *
 * Pairs are passed as args so no production IDs live in source. Each pair is
 * validated (run + comment exist, both belong to the same task, run not already
 * linked) before patching, so it is safe to re-run. Delete this export once it
 * has run in prod.
 */
export const backfillRunTriggeringComments = internalMutation({
  args: {
    links: v.array(
      v.object({
        runId: v.id("agentRuns"),
        commentId: v.id("taskComments"),
      }),
    ),
  },
  returns: v.object({
    linked: v.number(),
    skipped: v.array(
      v.object({ runId: v.id("agentRuns"), reason: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    let linked = 0;
    const skipped: { runId: Id<"agentRuns">; reason: string }[] = [];

    for (const { runId, commentId } of args.links) {
      const run = await ctx.db.get(runId);
      if (!run) {
        skipped.push({ runId, reason: "run not found" });
        continue;
      }
      if (run.triggeringCommentId) {
        skipped.push({ runId, reason: "already linked" });
        continue;
      }
      const comment = await ctx.db.get(commentId);
      if (!comment) {
        skipped.push({ runId, reason: "comment not found" });
        continue;
      }
      if (comment.taskId !== run.taskId) {
        skipped.push({
          runId,
          reason: "comment and run belong to different tasks",
        });
        continue;
      }
      await ctx.db.patch(runId, { triggeringCommentId: commentId });
      linked++;
    }

    console.log(
      `[migration] backfillRunTriggeringComments: linked ${linked}, skipped ${skipped.length}`,
    );
    return { linked, skipped };
  },
});
