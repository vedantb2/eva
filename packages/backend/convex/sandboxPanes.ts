import { v } from "convex/values";
import { authMutation, hasRepoAccess, hasTaskAccess } from "./functions";
import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { terminalPaneValidator } from "./validators";

const ownerArg = v.union(
  v.object({
    kind: v.literal("session"),
    sessionId: v.id("sessions"),
  }),
  v.object({
    kind: v.literal("task"),
    taskId: v.id("agentTasks"),
  }),
  v.object({
    kind: v.literal("project"),
    projectId: v.id("projects"),
  }),
);

type TerminalPane = {
  id: string;
  title: string;
  createdAt: number;
};

type ResolvedOwner =
  | {
      table: "sessions";
      id: Id<"sessions">;
      ownerKey: string;
      panes: TerminalPane[] | undefined;
    }
  | {
      table: "agentTasks";
      id: Id<"agentTasks">;
      ownerKey: string;
      panes: TerminalPane[] | undefined;
    }
  | {
      table: "projects";
      id: Id<"projects">;
      ownerKey: string;
      panes: TerminalPane[] | undefined;
    };

function defaultPane(ownerKey: string, createdAt: number): TerminalPane {
  return {
    id: `${ownerKey}-terminal-default`,
    title: "Terminal",
    createdAt,
  };
}

function nextPane(
  ownerKey: string,
  count: number,
  createdAt: number,
): TerminalPane {
  return {
    id: `${ownerKey}-terminal-${createdAt}`,
    title: `Terminal ${count + 1}`,
    createdAt,
  };
}

async function resolveOwner(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  owner:
    | { kind: "session"; sessionId: Id<"sessions"> }
    | { kind: "task"; taskId: Id<"agentTasks"> }
    | { kind: "project"; projectId: Id<"projects"> },
): Promise<ResolvedOwner | null> {
  if (owner.kind === "session") {
    const session = await db.get(owner.sessionId);
    if (!session || !(await hasRepoAccess(db, session.repoId, userId))) {
      return null;
    }
    return {
      table: "sessions",
      id: owner.sessionId,
      ownerKey: `session-${owner.sessionId}`,
      panes: session.terminalPanes,
    };
  }

  if (owner.kind === "task") {
    const task = await db.get(owner.taskId);
    if (!task || !(await hasTaskAccess(db, task, userId))) {
      return null;
    }
    return {
      table: "agentTasks",
      id: owner.taskId,
      ownerKey: `task-${owner.taskId}`,
      panes: task.terminalPanes,
    };
  }

  const project = await db.get(owner.projectId);
  if (!project || !(await hasRepoAccess(db, project.repoId, userId))) {
    return null;
  }
  return {
    table: "projects",
    id: owner.projectId,
    ownerKey: `project-${owner.projectId}`,
    panes: project.terminalPanes,
  };
}

async function patchPanes(
  db: GenericDatabaseWriter<DataModel>,
  owner: ResolvedOwner,
  panes: TerminalPane[],
) {
  // Per-table narrowing: db.patch's union of Id<"sessions"> | Id<"agentTasks">
  // | Id<"projects"> doesn't distribute over the generic, so each branch needs
  // its own call.
  if (owner.table === "sessions") {
    await db.patch(owner.id, { terminalPanes: panes });
  } else if (owner.table === "agentTasks") {
    await db.patch(owner.id, { terminalPanes: panes });
  } else {
    await db.patch(owner.id, { terminalPanes: panes });
  }
}

/** Ensures every active sandbox has a stable shared default terminal pane. */
export const ensureDefaultTerminalPane = authMutation({
  args: { owner: ownerArg },
  returns: v.array(terminalPaneValidator),
  handler: async (ctx, args) => {
    const owner = await resolveOwner(ctx.db, ctx.userId, args.owner);
    if (!owner) return [];
    const panes = owner.panes ?? [];
    if (panes.length > 0) return panes;
    const next = [defaultPane(owner.ownerKey, Date.now())];
    await patchPanes(ctx.db, owner, next);
    return next;
  },
});

/** Adds one shared terminal pane. All users viewing the sandbox see it. */
export const createTerminalPane = authMutation({
  args: { owner: ownerArg },
  returns: terminalPaneValidator,
  handler: async (ctx, args) => {
    const owner = await resolveOwner(ctx.db, ctx.userId, args.owner);
    if (!owner) throw new Error("Sandbox owner not found");
    const createdAt = Date.now();
    const panes =
      owner.panes && owner.panes.length > 0
        ? owner.panes
        : [defaultPane(owner.ownerKey, createdAt)];
    const pane = nextPane(owner.ownerKey, panes.length, createdAt);
    await patchPanes(ctx.db, owner, [...panes, pane]);
    return pane;
  },
});

/** Removes one shared terminal pane, keeping the stable dev-server terminal. */
export const closeTerminalPane = authMutation({
  args: {
    owner: ownerArg,
    paneId: v.string(),
  },
  returns: v.array(terminalPaneValidator),
  handler: async (ctx, args) => {
    const owner = await resolveOwner(ctx.db, ctx.userId, args.owner);
    if (!owner) return [];
    const panes =
      owner.panes && owner.panes.length > 0
        ? owner.panes
        : [defaultPane(owner.ownerKey, Date.now())];
    if (panes[0]?.id === args.paneId) return panes;
    const next = panes.filter((pane) => pane.id !== args.paneId);
    await patchPanes(ctx.db, owner, next);
    return next;
  },
});
