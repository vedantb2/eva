import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/** Migrates messages and queuedMessages from legacy "ask"/"execute" mode to "edit". */
export const migrateSessionModes = internalMutation({
  args: {},
  returns: v.object({ messagesUpdated: v.number(), queuedUpdated: v.number() }),
  handler: async (ctx) => {
    let messagesUpdated = 0;
    let queuedUpdated = 0;

    const allMessages = await ctx.db.query("messages").collect();
    for (const msg of allMessages) {
      if (msg.mode === "ask" || msg.mode === "execute") {
        await ctx.db.patch(msg._id, { mode: "edit" });
        messagesUpdated++;
      }
    }

    const allQueued = await ctx.db.query("queuedMessages").collect();
    for (const qm of allQueued) {
      if (qm.mode === "ask" || qm.mode === "execute") {
        await ctx.db.patch(qm._id, { mode: "edit" });
        queuedUpdated++;
      }
    }

    console.log(
      `[migration] migrateSessionModes: updated ${messagesUpdated} messages, ${queuedUpdated} queued messages`,
    );
    return { messagesUpdated, queuedUpdated };
  },
});
