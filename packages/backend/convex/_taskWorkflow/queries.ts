import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { aiModelValidator, runModeValidator } from "../validators";
import {
  resolveTaskWorkflowBaseBranch,
  resolveTaskWorkflowBaseBranchForTask,
} from "./resolveBaseBranch";
import {
  buildImplementationPrompt,
  buildConflictResolutionPrompt,
} from "./prompts";
import { resolveMessageTokens } from "../_mentions/resolveMessageTokens";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Formats a timestamp as a UK-style "DD Month YYYY" date (UTC, deterministic). */
function formatCommentDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Resolves a human-readable name for a comment author, falling back to "Reviewer". */
function userDisplayName(user: Doc<"users"> | null): string {
  if (!user) return "Reviewer";
  if (user.fullName?.trim()) return user.fullName.trim();
  const combined = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (combined) return combined;
  return user.email ?? "Reviewer";
}

/** Fetches task, repo, and audit config to build the prompt and sandbox parameters for a run. */
export const getTaskData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    mode: v.optional(runModeValidator),
  },
  returns: v.object({
    prompt: v.string(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
    projectSandboxId: v.optional(v.string()),
    taskSandboxId: v.optional(v.string()),
    keepTaskSandboxActiveAfterRun: v.boolean(),
    deploymentProjectName: v.optional(v.string()),
    rootDirectory: v.string(),
    screenshotsVideosEnabled: v.boolean(),
    proofModel: v.optional(aiModelValidator),
    auditCategories: v.array(
      v.object({ name: v.string(), description: v.string() }),
    ),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    const resolveDescriptionForPrompt = async (
      text: string | undefined,
    ): Promise<string | undefined> => {
      const trimmed = text?.trim();
      if (!trimmed) return undefined;
      const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
        ctx,
        trimmed,
        args.repoId,
      );
      if (prefixBlock) {
        return `${prefixBlock}\n\n${resolvedMessage}`;
      }
      return resolvedMessage;
    };

    let projectSandboxId: string | undefined;
    let projectContext: { title: string; description?: string } | undefined;
    let project = null;
    if (args.projectId) {
      project = await ctx.db.get(args.projectId);
      if (project) {
        projectSandboxId = project.sandboxId;
        projectContext = {
          title: project.title,
          description: await resolveDescriptionForPrompt(
            project.description ?? undefined,
          ),
        };
      }
    }

    const resolvedTaskDescription = await resolveDescriptionForPrompt(
      task.description ?? undefined,
    );

    // Non-project (quick) tasks persist their sandbox on the task itself so
    // change-request / resolve_conflicts runs reuse the same paused filesystem.
    const taskSandboxId = args.projectId ? undefined : task.sandboxId;
    const keepTaskSandboxActiveAfterRun =
      !args.projectId && task.reviewTaskSandboxStatus === "active";

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Only surface comments the last successful run hasn't already addressed,
    // so subsequent "Make changes" runs focus on NEW feedback. Cutoff is the
    // latest successful run's startedAt (not finishedAt), so comments added
    // while that run was in-flight still carry over. Failed/errored runs are
    // NOT cutoffs — their comments stay unaddressed for the next retry.
    const successfulRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task_and_status", (q) =>
        q.eq("taskId", args.taskId).eq("status", "success"),
      )
      .collect();
    const latestSuccessfulRun = successfulRuns.reduce<Doc<"agentRuns"> | null>(
      (latest, run) => {
        if (run.startedAt === undefined) return latest;
        if (
          latest === null ||
          latest.startedAt === undefined ||
          run.startedAt > latest.startedAt
        ) {
          return run;
        }
        return latest;
      },
      null,
    );
    const latestSuccessStartedAt = latestSuccessfulRun?.startedAt;
    // Surface what the last successful run accomplished so a "Make changes"
    // re-run has continuity instead of rediscovering prior work from scratch.
    const previousRunSummary =
      latestSuccessfulRun?.resultSummary?.trim() || undefined;
    const relevantComments =
      latestSuccessStartedAt !== undefined
        ? comments.filter((c) => c.createdAt > latestSuccessStartedAt)
        : comments;

    const sortedComments = relevantComments.sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    // Resolve author names once for the comments we are about to surface.
    const uniqueAuthorIds = [
      ...new Set(
        sortedComments
          .map((c) => c.authorId)
          .filter((id): id is Id<"users"> => id !== undefined),
      ),
    ];
    const authors = await Promise.all(
      uniqueAuthorIds.map((id) => ctx.db.get(id)),
    );
    const authorNameById = new Map<string, string>();
    uniqueAuthorIds.forEach((id, index) => {
      authorNameById.set(id, userDisplayName(authors[index]));
    });

    // Resolve any `@` mention tokens (matching how the task description is
    // prepared), then keep the raw resolved text for the commit subject
    // separate from the author/date-annotated text shown to the agent — the
    // annotation must not leak into the edit commit message.
    const changeRequests = await Promise.all(
      sortedComments.map(async (c) => {
        const author = c.authorId
          ? (authorNameById.get(c.authorId) ?? "Reviewer")
          : "Reviewer";
        const resolved =
          (await resolveDescriptionForPrompt(c.content)) ?? c.content;
        return {
          commitText: resolved,
          promptText: `[${author} · ${formatCommentDate(c.createdAt)}] ${resolved}`,
        };
      }),
    );

    const branchName = args.branchName || `eva/task-${args.taskId}`;

    const rootDirectory = repo.rootDirectory ?? "";

    // Per-task override wins. `undefined` on the task means "inherit repo".
    const screenshotsVideosEnabled =
      task.screenshotsVideosEnabled ?? repo.screenshotsVideosEnabled ?? false;

    const prompt =
      args.mode === "resolve_conflicts"
        ? buildConflictResolutionPrompt(
            branchName,
            resolveTaskWorkflowBaseBranch(task, repo, project ?? undefined),
            rootDirectory,
            repo.owner,
            repo.name,
            repo.systemPrompt,
          )
        : buildImplementationPrompt(
            {
              title: task.title,
              description: resolvedTaskDescription,
              taskNumber: task.taskNumber,
            },
            branchName,
            !args.projectId,
            rootDirectory,
            screenshotsVideosEnabled,
            repo.owner,
            repo.name,
            changeRequests.length > 0 ? changeRequests : undefined,
            projectContext,
            repo.systemPrompt,
            previousRunSummary,
          );

    const canonicalRepoId = repo.parentRepoId ?? args.repoId;
    const appId = repo.parentRepoId ? args.repoId : undefined;

    const categories = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalRepoId))
      .collect();

    const enabledCategories = categories
      .filter((c) => {
        if (!c.enabled) return false;
        const isRepoLevel = c.appId === undefined;
        const isForThisApp = c.appId !== undefined && c.appId === appId;
        return isRepoLevel || isForThisApp;
      })
      .map((c) => ({ name: c.name, description: c.description }));

    return {
      prompt,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      taskTitle: task.title,
      taskDescription: resolvedTaskDescription ?? task.description,
      projectSandboxId,
      taskSandboxId,
      keepTaskSandboxActiveAfterRun,
      deploymentProjectName: repo.deploymentProjectName,
      rootDirectory,
      screenshotsVideosEnabled,
      proofModel: repo.proofModel,
      auditCategories: enabledCategories,
    };
  },
});

/** Fetches everything the manual Create PR action needs in one round-trip:
 * task/repo metadata for the GitHub call, the latest run to attach the
 * resulting URL to, and the change-request/proof enrichment for the body. */
export const getTaskPrCreationData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.object({
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    taskTitle: v.string(),
    taskDescription: v.optional(v.string()),
    rootDirectory: v.string(),
    projectId: v.optional(v.id("projects")),
    isQuickTask: v.boolean(),
    latestRunId: v.union(v.id("agentRuns"), v.null()),
    existingPrUrl: v.union(v.string(), v.null()),
    changeRequests: v.array(v.string()),
    proofs: v.array(
      v.object({
        fileName: v.union(v.string(), v.null()),
        message: v.union(v.string(), v.null()),
        url: v.union(v.string(), v.null()),
        contentType: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.repoId) throw new Error("Task has no repository");

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const sortedRuns = runs.sort(
      (a, b) =>
        (b.startedAt ?? b._creationTime) - (a.startedAt ?? a._creationTime),
    );
    const latestRun = sortedRuns[0] ?? null;
    const existingPrUrl = sortedRuns.find((r) => r.prUrl)?.prUrl ?? null;

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const changeRequests = comments
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.content);

    const taskProofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const proofs = await Promise.all(
      taskProofs.map(async (p) => {
        if (!p.storageId) {
          return {
            fileName: p.fileName ?? null,
            message: p.message ?? null,
            url: null,
            contentType: null,
          };
        }
        const meta = await ctx.db.system.get("_storage", p.storageId);
        return {
          fileName: p.fileName ?? null,
          message: p.message ?? null,
          url: (await ctx.storage.getUrl(p.storageId)) ?? null,
          contentType: meta?.contentType ?? null,
        };
      }),
    );

    return {
      installationId: repo.installationId,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName: `eva/task-${args.taskId}`,
      baseBranch: await resolveTaskWorkflowBaseBranchForTask(
        ctx.db,
        task,
        repo,
      ),
      taskTitle: task.title,
      taskDescription: task.description,
      rootDirectory: repo.rootDirectory ?? "",
      projectId: task.projectId,
      isQuickTask: task.projectId === undefined,
      latestRunId: latestRun ? latestRun._id : null,
      existingPrUrl,
      changeRequests,
      proofs,
    };
  },
});

/** Fetches task comments and proof attachments for enriching PR descriptions. */
export const getPrEnrichmentData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.object({
    changeRequests: v.array(v.string()),
    proofs: v.array(
      v.object({
        fileName: v.union(v.string(), v.null()),
        message: v.union(v.string(), v.null()),
        url: v.union(v.string(), v.null()),
        contentType: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const changeRequests = comments
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => c.content);

    const taskProofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const proofs = await Promise.all(
      taskProofs.map(async (p) => {
        if (!p.storageId) {
          return {
            fileName: p.fileName ?? null,
            message: p.message ?? null,
            url: null,
            contentType: null,
          };
        }
        const meta = await ctx.db.system.get("_storage", p.storageId);
        return {
          fileName: p.fileName ?? null,
          message: p.message ?? null,
          url: (await ctx.storage.getUrl(p.storageId)) ?? null,
          contentType: meta?.contentType ?? null,
        };
      }),
    );

    return { changeRequests, proofs };
  },
});
