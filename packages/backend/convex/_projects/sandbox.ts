import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { authMutation, getProjectWithAccess } from "../functions";
import { workflow } from "../workflowManager";

const PREVIEW_ALLOWED_PHASES = ["active"] as const;

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
        `Project must be in active phase to start sandbox. Current phase: ${project.phase}`,
      );
    }

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const branchName = project.branchName ?? repo.defaultBaseBranch ?? "main";
    const baseBranch = project.baseBranch ?? repo.defaultBaseBranch ?? "main";

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
