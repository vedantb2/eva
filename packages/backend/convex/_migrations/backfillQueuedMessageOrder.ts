import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Backfills `order` on queued messages that predate the field, setting it to
 * `createdAt` so existing rows keep their FIFO run order under the new
 * `by_parent_and_order` index. queuedMessages are transient (consumed within
 * minutes), so this mainly guards rows in flight at deploy time.
 *
 * Run once: `npx convex run migrations:backfillQueuedMessageOrder`
 * Delete this function after it has run everywhere it was needed.
 */
export const backfillQueuedMessageOrder = internalMutation({
  args: {},
  returns: v.object({ patched: v.number() }),
  handler: async (ctx) => {
    let patched = 0;
    const messages = await ctx.db.query("queuedMessages").collect();
    for (const message of messages) {
      if (message.order !== undefined) {
        continue;
      }
      await ctx.db.patch(message._id, { order: message.createdAt });
      patched++;
    }
    console.log(
      `[migration] backfillQueuedMessageOrder: patched ${patched} queued messages`,
    );
    return { patched };
  },
});
