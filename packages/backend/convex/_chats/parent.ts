import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import {
  getProjectWithAccess,
  getSessionWithAccess,
  getTaskWithAccess,
} from "../functions";

export type ChatParentRuntime = {
  parentId: Id<"sessions"> | Id<"projects"> | Id<"agentTasks">;
  parentKind: "session" | "project" | "task";
  repoId: Id<"githubRepos">;
  credentialOwnerUserId: Id<"users">;
  sandboxId: string | undefined;
  sandboxActive: boolean;
  branchName: string | undefined;
  title: string;
  mainChatRunning: boolean;
};

/** Resolves a chat host into one normalized runtime shape and verifies access. */
export async function resolveChatParent(
  db: GenericDatabaseReader<DataModel>,
  parentId: Id<"sessions"> | Id<"projects"> | Id<"agentTasks">,
  userId: Id<"users">,
): Promise<ChatParentRuntime> {
  const rawId = String(parentId);
  const sessionId = db.normalizeId("sessions", rawId);
  if (sessionId) {
    const session = await getSessionWithAccess(db, sessionId, userId);
    return {
      parentId: session._id,
      parentKind: "session",
      repoId: session.repoId,
      credentialOwnerUserId: session.createdBy ?? session.userId,
      sandboxId: session.sandboxId,
      sandboxActive:
        session.status !== "closed" && session.status !== "stopping",
      branchName: session.branchName,
      title: session.title,
      mainChatRunning: session.activeWorkflowId !== undefined,
    };
  }

  const projectId = db.normalizeId("projects", rawId);
  if (projectId) {
    const project = await getProjectWithAccess(db, projectId, userId);
    return {
      parentId: project._id,
      parentKind: "project",
      repoId: project.repoId,
      credentialOwnerUserId: project.userId,
      sandboxId: project.sandboxId,
      sandboxActive:
        project.reviewProjectSandboxStatus !== "closed" &&
        project.reviewProjectSandboxStatus !== "stopping",
      branchName: project.branchName,
      title: project.title,
      mainChatRunning: project.activeChatWorkflowId !== undefined,
    };
  }

  const taskId = db.normalizeId("agentTasks", rawId);
  if (!taskId) throw new Error("Chat parent not found");
  const task = await getTaskWithAccess(db, taskId, userId);
  let repoId = task.repoId;
  let sandboxId = task.sandboxId;
  let branchName = task.baseBranch;
  let sandboxActive =
    task.reviewTaskSandboxStatus !== "closed" &&
    task.reviewTaskSandboxStatus !== "stopping";
  if (task.projectId) {
    const project = await db.get(task.projectId);
    if (!project) throw new Error("Project not found");
    repoId = project.repoId;
    sandboxId = project.sandboxId;
    branchName = project.branchName;
    sandboxActive =
      project.reviewProjectSandboxStatus !== "closed" &&
      project.reviewProjectSandboxStatus !== "stopping";
  }
  if (!repoId) throw new Error("Task has no repository");
  return {
    parentId: task._id,
    parentKind: "task",
    repoId,
    credentialOwnerUserId: task.createdBy,
    sandboxId,
    sandboxActive,
    branchName,
    title: task.title,
    mainChatRunning: task.activeChatWorkflowId !== undefined,
  };
}
