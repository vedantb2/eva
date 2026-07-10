import { v } from "convex/values";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Discriminated owner — a PTY belongs to a session, a quick task, or a project.
 * All expose a sandbox and a repo; sessions additionally track a default
 * `ptySessionId` for the legacy single-terminal flow.
 */
export const ownerArg = v.union(
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

export interface ResolvedOwner {
  sandboxId: string;
  repoId: Id<"githubRepos">;
  /** Legacy default-terminal pointer; only sessions track this. */
  defaultPtyId: string | undefined;
  /** Bound mutator for the default-terminal pointer; tasks have no equivalent. */
  setDefaultPtyId: ((nextPtyId: string) => Promise<void>) | undefined;
  /** Stable suffix used to derive the legacy default PTY name when missing. */
  ownerIdSuffix: string;
  /**
   * True when the owner is `stopping`/`closed`. A terminal connect must not
   * exec on the sandbox in this state — on Vercel any exec lazily resumes a
   * stopped VM (SDK withResume), which resurrects a sandbox the user stopped
   * (invisible to the session status) and defeats a manual stop.
   */
  isStoppingOrClosed: boolean;
}

export async function resolveOwner(
  ctx: ActionCtx,
  owner:
    | { kind: "session"; sessionId: Id<"sessions"> }
    | { kind: "task"; taskId: Id<"agentTasks"> }
    | { kind: "project"; projectId: Id<"projects"> },
): Promise<ResolvedOwner> {
  if (owner.kind === "session") {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: owner.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("Sandbox not active");
    return {
      sandboxId: session.sandboxId,
      repoId: session.repoId,
      defaultPtyId: session.ptySessionId || undefined,
      setDefaultPtyId: async (nextPtyId: string) => {
        await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
          id: owner.sessionId,
          ptySessionId: nextPtyId,
        });
      },
      ownerIdSuffix: String(owner.sessionId).slice(-8),
      isStoppingOrClosed:
        session.status === "stopping" || session.status === "closed",
    };
  }

  if (owner.kind === "task") {
    const task = await ctx.runQuery(internal.agentTasks.getInternal, {
      id: owner.taskId,
    });
    if (!task) throw new Error("Task not found");
    if (!task.sandboxId) throw new Error("Sandbox not active");
    if (!task.repoId) throw new Error("Task has no repo");
    return {
      sandboxId: task.sandboxId,
      repoId: task.repoId,
      defaultPtyId: undefined,
      setDefaultPtyId: undefined,
      ownerIdSuffix: String(owner.taskId).slice(-8),
      isStoppingOrClosed:
        task.reviewTaskSandboxStatus === "stopping" ||
        task.reviewTaskSandboxStatus === "closed",
    };
  }

  const project = await ctx.runQuery(internal.projects.getInternal, {
    id: owner.projectId,
  });
  if (!project) throw new Error("Project not found");
  if (!project.sandboxId) throw new Error("Sandbox not active");
  return {
    sandboxId: project.sandboxId,
    repoId: project.repoId,
    defaultPtyId: undefined,
    setDefaultPtyId: undefined,
    ownerIdSuffix: String(owner.projectId).slice(-8),
    isStoppingOrClosed:
      project.reviewProjectSandboxStatus === "stopping" ||
      project.reviewProjectSandboxStatus === "closed",
  };
}
