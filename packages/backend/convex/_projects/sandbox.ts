import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { authMutation, getProjectWithAccess, hasActiveRun } from "../functions";
import { workflow } from "../workflowManager";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { buildProjectBranchName } from "./helpers";

const PREVIEW_ALLOWED_PHASES = [
  "in_progress",
  "business_review",
  "code_review",
] as const;

/** Starts a preview sandbox for a project, checking out the project branch and running startup commands. */
export const startProjectSandbox = authMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(
      ctx.db,
      args.projectId,
      ctx.userId,
    );

    if (
      !PREVIEW_ALLOWED_PHASES.includes(
        project.phase as (typeof PREVIEW_ALLOWED_PHASES)[number],
      )
    ) {
      throw new Error(
        `Project must be in in_progress, business_review, or code_review to start sandbox. Current phase: ${project.phase}`,
      );
    }

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const branchName =
      project.branchName ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
    const baseBranch =
      project.baseBranch ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;

    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "starting",
    });

    await workflow.start(
      ctx,
      internal.projectSandboxWorkflow.projectPreviewSandboxStartupWorkflow,
      {
        projectId: args.projectId,
        existingSandboxId: project.sandboxId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: project.repoId,
      },
    );

    return null;
  },
});

/**
 * Re-runs startup commands for a project's preview sandbox by kicking off the
 * regular sandbox startup workflow with `forceStartupCommands: true`. Used to
 * recover when startup commands previously failed (the marker file is created
 * regardless of failure, so a normal start would skip them).
 *
 * Auto-starts the sandbox if it isn't running yet — same workflow path either
 * way, just with the force flag set so commands always re-execute.
 */
export const retryProjectStartupCommands = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(
      ctx.db,
      args.projectId,
      ctx.userId,
    );

    if (
      !PREVIEW_ALLOWED_PHASES.includes(
        project.phase as (typeof PREVIEW_ALLOWED_PHASES)[number],
      )
    ) {
      throw new Error(
        `Project must be in in_progress, business_review, or code_review to run startup commands. Current phase: ${project.phase}`,
      );
    }

    if (
      project.reviewProjectSandboxStatus === "starting" ||
      project.reviewProjectSandboxStatus === "stopping"
    ) {
      throw new Error(
        "Sandbox is currently starting or stopping. Wait for it to settle before retrying.",
      );
    }

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const branchName =
      project.branchName ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
    const baseBranch =
      project.baseBranch ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;

    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "starting",
    });

    await workflow.start(
      ctx,
      internal.projectSandboxWorkflow.projectPreviewSandboxStartupWorkflow,
      {
        projectId: args.projectId,
        existingSandboxId: project.sandboxId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: project.repoId,
        forceStartupCommands: true,
      },
    );

    return null;
  },
});

/**
 * Spawns an agent run on the project branch with the resolve_conflicts prompt.
 * Reuses the project's persistent sandbox and the existing task workflow
 * machinery. Picks the project's most recently updated non-draft task as the
 * carrier for the run — that task's status will be bumped to in_progress for
 * the duration and end up in code_review on completion (same lifecycle as a
 * task-level resolve_conflicts run).
 */
export const resolveProjectConflicts = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(
      ctx.db,
      args.projectId,
      ctx.userId,
    );

    if (!project.prUrl) {
      throw new Error("Project has no PR to resolve conflicts for");
    }
    if (project.activeBuildWorkflowId) {
      throw new Error(
        "Cannot resolve conflicts while a build is active. Stop the build first.",
      );
    }

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const projectTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const pt of projectTasks) {
      if (await hasActiveRun(ctx.db, pt._id)) {
        throw new Error(
          "Another task in this project is already running. Wait for it to finish.",
        );
      }
    }

    const carrier = projectTasks
      .filter((t) => t.status !== "draft")
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];

    if (!carrier) {
      throw new Error("No task in project to carry a resolve-conflicts run");
    }

    const branchName =
      project.branchName ??
      buildProjectBranchName(args.projectId, project.branchVersion);
    const baseBranch =
      project.baseBranch ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;

    const previousStatus = carrier.status;
    const runId = await ctx.db.insert("agentRuns", {
      taskId: carrier._id,
      status: "queued",
      logs: [],
      startedAt: Date.now(),
      mode: "resolve_conflicts",
    });
    await ctx.db.patch(carrier._id, {
      status: "in_progress",
      updatedAt: Date.now(),
    });

    let workflowIdString = "";
    try {
      const workflowId = await workflow.start(
        ctx,
        internal.taskWorkflow.taskExecutionWorkflow,
        {
          runId,
          taskId: carrier._id,
          repoId: project.repoId,
          installationId: repo.installationId,
          projectId: args.projectId,
          branchName,
          baseBranch,
          isFirstTaskOnBranch: false,
          model: carrier.model ?? repo.defaultModel,
          userId: ctx.userId,
          mode: "resolve_conflicts",
        },
      );
      workflowIdString = String(workflowId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start workflow";
      await ctx.db.patch(runId, {
        status: "error",
        error: message,
        finishedAt: Date.now(),
        exitReason: "workflow_start_failed",
      });
      await ctx.db.patch(carrier._id, {
        status: previousStatus,
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
      throw error;
    }

    await ctx.db.patch(carrier._id, {
      activeWorkflowId: workflowIdString,
    });

    return null;
  },
});

/**
 * Stops the preview sandbox in Daytona. Keeps `sandboxId` so the user can
 * resume the same paused filesystem on next start.
 *
 * Marks the project as `"stopping"` synchronously so the UI can show a spinner
 * and disable the Start button until the real Daytona stop (~10s) completes.
 */
export const stopProjectSandbox = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(
      ctx.db,
      args.projectId,
      ctx.userId,
    );

    if (!project.sandboxId) {
      // Nothing to stop — close immediately.
      await ctx.db.patch(args.projectId, {
        reviewProjectSandboxStatus: "closed",
      });
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal._projects.sandbox.finalizeStopProjectSandbox,
      {
        projectId: args.projectId,
        sandboxId: project.sandboxId,
        repoId: project.repoId,
      },
    );

    // Keep sandboxId so we can resume the stopped sandbox later.
    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "stopping",
    });

    return null;
  },
});

/**
 * Awaits the Daytona stop and finalizes the project sandbox status to `"closed"`.
 * Always flips status, even if Daytona errors — a stuck `"stopping"` state
 * would leave the user unable to Start.
 */
export const finalizeStopProjectSandbox = internalAction({
  args: {
    projectId: v.id("projects"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.runAction(internal.daytona.stopSandbox, {
        sandboxId: args.sandboxId,
        repoId: args.repoId,
      });
    } finally {
      await ctx.runMutation(
        internal._projects.sandbox.markProjectSandboxClosed,
        { projectId: args.projectId },
      );
    }
    return null;
  },
});

/** Internal: flips project sandbox status from `"stopping"` to `"closed"` after Daytona stop completes. */
export const markProjectSandboxClosed = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    // Only flip if still stopping — don't overwrite a fresh start.
    if (project.reviewProjectSandboxStatus !== "stopping") return null;
    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "closed",
    });
    return null;
  },
});

/** Marks a project preview sandbox as ready (internal use). */
export const projectSandboxReady = internalMutation({
  args: {
    projectId: v.id("projects"),
    sandboxId: v.string(),
    isNew: v.boolean(),
    devPort: v.optional(v.number()),
    devCommand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    await ctx.db.patch(args.projectId, {
      sandboxId: args.sandboxId,
      reviewProjectSandboxStatus: "active",
      lastSandboxActivity: Date.now(),
      devPort: args.devPort,
      devCommand: args.devCommand,
    });

    return null;
  },
});

/** Marks a project preview sandbox as starting (internal use). */
export const projectSandboxStarting = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "starting",
      lastSandboxActivity: Date.now(),
    });

    return null;
  },
});

/** Persists the sandbox id as soon as Daytona creates it, before long startup steps. */
export const projectSandboxAllocated = internalMutation({
  args: {
    projectId: v.id("projects"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    await ctx.db.patch(args.projectId, {
      sandboxId: args.sandboxId,
      reviewProjectSandboxStatus: "starting",
      lastSandboxActivity: Date.now(),
    });

    return null;
  },
});

/** Records a project sandbox startup failure (internal use). */
export const projectSandboxError = internalMutation({
  args: {
    projectId: v.id("projects"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    await ctx.db.patch(args.projectId, {
      reviewProjectSandboxStatus: "closed",
    });

    return null;
  },
});
