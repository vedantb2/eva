import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
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

/**
 * Reconciles a stale "active" sandbox status to "closed" when prewarm
 * observes the sandbox is not actually running. On Vercel, a stopped VM
 * with a lingering "active" status would otherwise let the Console/PTY
 * path lazily resume it without its dev server, Convex backend, or tmux
 * session — those only launch in the startup workflow. Flipping to
 * "closed" makes the UI offer Start, the one path that relaunches them.
 *
 * Only flips when the doc still points at the sandbox the caller observed
 * and the current status is exactly "active" — "starting"/"stopping"/
 * "closed" are left alone since the start/stop flows own those.
 */
export const reconcileStoppedSandboxStatus = internalMutation({
  args: {
    entityTable: v.union(
      v.literal("sessions"),
      v.literal("agentTasks"),
      v.literal("projects"),
    ),
    entityId: v.string(),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.entityTable === "sessions") {
      const id = ctx.db.normalizeId("sessions", args.entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      if (!doc) return null;
      if (
        doc.sandboxId !== args.sandboxId &&
        doc.vercelSandboxId !== args.sandboxId
      ) {
        return null;
      }
      if (doc.status !== "active") return null;
      await ctx.db.patch(id, { status: "closed", updatedAt: Date.now() });
      console.log(
        `[daytona] reconcileStoppedSandboxStatus: sessions ${id} active → closed (sandbox ${args.sandboxId} not running)`,
      );
      return null;
    }
    if (args.entityTable === "agentTasks") {
      const id = ctx.db.normalizeId("agentTasks", args.entityId);
      if (!id) return null;
      const doc = await ctx.db.get(id);
      if (!doc) return null;
      if (
        doc.sandboxId !== args.sandboxId &&
        doc.vercelSandboxId !== args.sandboxId
      ) {
        return null;
      }
      if (doc.reviewTaskSandboxStatus !== "active") return null;
      await ctx.db.patch(id, { reviewTaskSandboxStatus: "closed" });
      console.log(
        `[daytona] reconcileStoppedSandboxStatus: agentTasks ${id} active → closed (sandbox ${args.sandboxId} not running)`,
      );
      return null;
    }
    const id = ctx.db.normalizeId("projects", args.entityId);
    if (!id) return null;
    const doc = await ctx.db.get(id);
    if (!doc) return null;
    if (
      doc.sandboxId !== args.sandboxId &&
      doc.vercelSandboxId !== args.sandboxId
    ) {
      return null;
    }
    if (doc.reviewProjectSandboxStatus !== "active") return null;
    await ctx.db.patch(id, { reviewProjectSandboxStatus: "closed" });
    console.log(
      `[daytona] reconcileStoppedSandboxStatus: projects ${id} active → closed (sandbox ${args.sandboxId} not running)`,
    );
    return null;
  },
});
