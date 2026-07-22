import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { pendingTurnValidator } from "../_validators/tableFields";

const emptyDaemonEntitySnapshot = {
  pendingTurn: undefined,
  activeWorkflow: undefined,
  syntheticTurnMessageId: undefined,
};

/** Reads daemon-relevant fields for mid-turn respawn deferral decisions. */
export const readDaemonEntitySnapshot = internalQuery({
  args: {
    entityTable: v.union(
      v.literal("sessions"),
      v.literal("agentTasks"),
      v.literal("projects"),
    ),
    entityId: v.string(),
  },
  returns: v.object({
    pendingTurn: pendingTurnValidator,
    activeWorkflow: v.optional(v.string()),
    syntheticTurnMessageId: v.optional(v.id("messages")),
  }),
  handler: async (ctx, args) => {
    if (args.entityTable === "sessions") {
      const id = ctx.db.normalizeId("sessions", args.entityId);
      if (!id) return emptyDaemonEntitySnapshot;
      const doc = await ctx.db.get(id);
      if (!doc) return emptyDaemonEntitySnapshot;
      return {
        pendingTurn: doc.pendingTurn,
        activeWorkflow: doc.activeWorkflowId,
        syntheticTurnMessageId: doc.syntheticTurnMessageId,
      };
    }
    if (args.entityTable === "agentTasks") {
      const id = ctx.db.normalizeId("agentTasks", args.entityId);
      if (!id) return emptyDaemonEntitySnapshot;
      const doc = await ctx.db.get(id);
      if (!doc) return emptyDaemonEntitySnapshot;
      return {
        pendingTurn: doc.pendingTurn,
        activeWorkflow: doc.activeChatWorkflowId,
        syntheticTurnMessageId: doc.syntheticTurnMessageId,
      };
    }
    const id = ctx.db.normalizeId("projects", args.entityId);
    if (!id) return emptyDaemonEntitySnapshot;
    const doc = await ctx.db.get(id);
    if (!doc) return emptyDaemonEntitySnapshot;
    return {
      pendingTurn: doc.pendingTurn,
      activeWorkflow: doc.activeChatWorkflowId,
      syntheticTurnMessageId: doc.syntheticTurnMessageId,
    };
  },
});
