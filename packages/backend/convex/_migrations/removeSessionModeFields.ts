import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const PAGE_SIZE = 25;

const phaseValidator = v.union(
  v.literal("sessions"),
  v.literal("messages"),
  v.literal("queuedMessages"),
  v.literal("sessionDaemonStates"),
  v.literal("projects"),
  v.literal("agentTasks"),
  v.literal("designPersonas"),
);

type Phase =
  | "sessions"
  | "messages"
  | "queuedMessages"
  | "sessionDaemonStates"
  | "projects"
  | "agentTasks"
  | "designPersonas";

type Counts = {
  sessionsPatched: number;
  messagesPatched: number;
  queuedPatched: number;
  daemonStatesPatched: number;
  projectsPatched: number;
  tasksPatched: number;
  personasDeleted: number;
};

type LegacyPendingTurnJson = NonNullable<Doc<"sessions">["pendingTurn"]> & {
  turnKind?: "conversational" | "agent";
};

type LegacySessionJson = Doc<"sessions"> & {
  lastMode?: string;
  selectedVariationIndex?: number;
  pendingTurn?: LegacyPendingTurnJson;
};

type LegacyMessageJson = Doc<"messages"> & {
  mode?: string;
  personaId?: Id<"designPersonas">;
};

type LegacyQueuedJson = Doc<"queuedMessages"> & {
  mode?: string;
  personaId?: Id<"designPersonas">;
  numDesigns?: number;
};

type LegacyDaemonStateJson = Doc<"sessionDaemonStates"> & {
  pendingTurn?: LegacyPendingTurnJson;
};

type LegacyProjectJson = Doc<"projects"> & {
  pendingTurn?: LegacyPendingTurnJson;
};

type LegacyTaskJson = Doc<"agentTasks"> & {
  pendingTurn?: LegacyPendingTurnJson;
};

const emptyCounts = (): Counts => ({
  sessionsPatched: 0,
  messagesPatched: 0,
  queuedPatched: 0,
  daemonStatesPatched: 0,
  projectsPatched: 0,
  tasksPatched: 0,
  personasDeleted: 0,
});

function stripTurnKind(
  pendingTurn: LegacyPendingTurnJson,
): NonNullable<Doc<"sessions">["pendingTurn"]> {
  const { turnKind: omittedTurnKind, ...rest } = pendingTurn;
  void omittedTurnKind;
  return rest;
}

function stripSession(
  session: Doc<"sessions">,
): Omit<Doc<"sessions">, "_id" | "_creationTime"> | null {
  const parsed: LegacySessionJson = JSON.parse(JSON.stringify(session));
  const hasTurnKind = parsed.pendingTurn?.turnKind !== undefined;
  if (
    parsed.lastMode === undefined &&
    parsed.selectedVariationIndex === undefined &&
    !hasTurnKind
  ) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    lastMode: omittedLastMode,
    selectedVariationIndex: omittedVariation,
    pendingTurn,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedLastMode;
  void omittedVariation;
  if (pendingTurn === undefined) {
    return rest;
  }
  return {
    ...rest,
    pendingTurn: hasTurnKind ? stripTurnKind(pendingTurn) : pendingTurn,
  };
}

function stripMessage(
  message: Doc<"messages">,
): Omit<Doc<"messages">, "_id" | "_creationTime"> | null {
  const parsed: LegacyMessageJson = JSON.parse(JSON.stringify(message));
  if (parsed.mode === undefined && parsed.personaId === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    mode: omittedMode,
    personaId: omittedPersonaId,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedMode;
  void omittedPersonaId;
  return rest;
}

function stripQueued(
  queued: Doc<"queuedMessages">,
): Omit<Doc<"queuedMessages">, "_id" | "_creationTime"> | null {
  const parsed: LegacyQueuedJson = JSON.parse(JSON.stringify(queued));
  if (
    parsed.mode === undefined &&
    parsed.personaId === undefined &&
    parsed.numDesigns === undefined
  ) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    mode: omittedMode,
    personaId: omittedPersonaId,
    numDesigns: omittedNumDesigns,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  void omittedMode;
  void omittedPersonaId;
  void omittedNumDesigns;
  return rest;
}

function stripDaemonState(
  state: Doc<"sessionDaemonStates">,
): Omit<Doc<"sessionDaemonStates">, "_id" | "_creationTime"> | null {
  const parsed: LegacyDaemonStateJson = JSON.parse(JSON.stringify(state));
  if (parsed.pendingTurn?.turnKind === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    pendingTurn,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  if (pendingTurn === undefined) {
    return rest;
  }
  return { ...rest, pendingTurn: stripTurnKind(pendingTurn) };
}

function stripProject(
  project: Doc<"projects">,
): Omit<Doc<"projects">, "_id" | "_creationTime"> | null {
  const parsed: LegacyProjectJson = JSON.parse(JSON.stringify(project));
  if (parsed.pendingTurn?.turnKind === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    pendingTurn,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  if (pendingTurn === undefined) {
    return rest;
  }
  return { ...rest, pendingTurn: stripTurnKind(pendingTurn) };
}

function stripTask(
  task: Doc<"agentTasks">,
): Omit<Doc<"agentTasks">, "_id" | "_creationTime"> | null {
  const parsed: LegacyTaskJson = JSON.parse(JSON.stringify(task));
  if (parsed.pendingTurn?.turnKind === undefined) {
    return null;
  }
  const {
    _id: omittedId,
    _creationTime: omittedCreationTime,
    pendingTurn,
    ...rest
  } = parsed;
  void omittedId;
  void omittedCreationTime;
  if (pendingTurn === undefined) {
    return rest;
  }
  return { ...rest, pendingTurn: stripTurnKind(pendingTurn) };
}

const NEXT_PHASE: Record<Phase, Phase | null> = {
  sessions: "messages",
  messages: "queuedMessages",
  queuedMessages: "sessionDaemonStates",
  sessionDaemonStates: "projects",
  projects: "agentTasks",
  agentTasks: "designPersonas",
  designPersonas: null,
};

/**
 * Strips write-dead session-mode columns so the schema can drop them.
 *
 * Run: `npx convex run migrations:removeSessionModeFields`
 * Reschedules itself per page. Safe to re-run — docs with none of the
 * target fields are skipped.
 */
export const removeSessionModeFields = internalMutation({
  args: {
    phase: v.optional(phaseValidator),
    cursor: v.optional(v.string()),
    counts: v.optional(
      v.object({
        sessionsPatched: v.number(),
        messagesPatched: v.number(),
        queuedPatched: v.number(),
        daemonStatesPatched: v.number(),
        projectsPatched: v.number(),
        tasksPatched: v.number(),
        personasDeleted: v.number(),
      }),
    ),
  },
  returns: v.object({
    phase: phaseValidator,
    done: v.boolean(),
    counts: v.object({
      sessionsPatched: v.number(),
      messagesPatched: v.number(),
      queuedPatched: v.number(),
      daemonStatesPatched: v.number(),
      projectsPatched: v.number(),
      tasksPatched: v.number(),
      personasDeleted: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const phase: Phase = args.phase ?? "sessions";
    const counts: Counts = args.counts ?? emptyCounts();

    if (phase === "sessions") {
      const page = await ctx.db.query("sessions").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const session of page.page) {
        const cleaned = stripSession(session);
        if (!cleaned) continue;
        await ctx.db.replace(session._id, cleaned);
        counts.sessionsPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    if (phase === "messages") {
      const page = await ctx.db.query("messages").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const message of page.page) {
        const cleaned = stripMessage(message);
        if (!cleaned) continue;
        await ctx.db.replace(message._id, cleaned);
        counts.messagesPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    if (phase === "queuedMessages") {
      const page = await ctx.db.query("queuedMessages").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const queued of page.page) {
        const cleaned = stripQueued(queued);
        if (!cleaned) continue;
        await ctx.db.replace(queued._id, cleaned);
        counts.queuedPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    if (phase === "sessionDaemonStates") {
      const page = await ctx.db.query("sessionDaemonStates").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const state of page.page) {
        const cleaned = stripDaemonState(state);
        if (!cleaned) continue;
        await ctx.db.replace(state._id, cleaned);
        counts.daemonStatesPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    if (phase === "projects") {
      const page = await ctx.db.query("projects").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const project of page.page) {
        const cleaned = stripProject(project);
        if (!cleaned) continue;
        await ctx.db.replace(project._id, cleaned);
        counts.projectsPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    if (phase === "agentTasks") {
      const page = await ctx.db.query("agentTasks").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const task of page.page) {
        const cleaned = stripTask(task);
        if (!cleaned) continue;
        await ctx.db.replace(task._id, cleaned);
        counts.tasksPatched += 1;
      }
      return continueOrAdvance(ctx, phase, page, counts);
    }

    const page = await ctx.db.query("designPersonas").paginate({
      cursor: args.cursor ?? null,
      numItems: PAGE_SIZE,
    });
    for (const persona of page.page) {
      await ctx.db.delete(persona._id);
      counts.personasDeleted += 1;
    }
    return continueOrAdvance(ctx, phase, page, counts);
  },
});

async function continueOrAdvance(
  ctx: MutationCtx,
  phase: Phase,
  page: { isDone: boolean; continueCursor: string },
  counts: Counts,
): Promise<{ phase: Phase; done: boolean; counts: Counts }> {
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.removeSessionModeFields,
      {
        phase,
        cursor: page.continueCursor,
        counts,
      },
    );
    return { phase, done: false, counts };
  }

  const next = NEXT_PHASE[phase];
  if (next !== null) {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.removeSessionModeFields,
      {
        phase: next,
        counts,
      },
    );
    return { phase: next, done: false, counts };
  }

  console.log(
    `[migration] removeSessionModeFields: sessions=${counts.sessionsPatched} messages=${counts.messagesPatched} queued=${counts.queuedPatched} daemonStates=${counts.daemonStatesPatched} projects=${counts.projectsPatched} tasks=${counts.tasksPatched} personas=${counts.personasDeleted}`,
  );
  return { phase, done: true, counts };
}
