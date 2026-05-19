"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { getInstallationOctokit } from "./githubAuth";
import {
  buildPrBody,
  buildTaskPrSections,
  buildProjectPrSections,
} from "./prBody";
import { buildEvaTaskUrl, buildEvaProjectUrl } from "./_taskWorkflow/urls";
import {
  AUDIT_SECTION_REGEX,
  buildAuditSection,
  mergeBodyWithAuditSection,
} from "./_taskWorkflow/prAudit";
import {
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  mapGitHubDeploymentState,
  isTerminalDeploymentStatus,
  resolveStableDeploymentUrl,
} from "./_taskWorkflow/deploymentHelpers";

// Re-export URL builders for backwards compatibility
export { buildEvaTaskUrl, buildEvaSessionUrl } from "./_taskWorkflow/urls";

const PR_READY_WAIT_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 12000, 16000];

const taskPrProofValidator = v.object({
  fileName: v.union(v.string(), v.null()),
  message: v.union(v.string(), v.null()),
  url: v.union(v.string(), v.null()),
  contentType: v.union(v.string(), v.null()),
});

type TaskPrProof = {
  fileName: string | null;
  message: string | null;
  url: string | null;
  contentType: string | null;
};

type PullRequestCreateParams = {
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch?: string;
  title: string;
  body: string;
  labels: string[];
  draft?: boolean;
};

type PullRequestRefreshParams = {
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
  body: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildTaskPullRequestBody(params: {
  repoOwner: string;
  repoName: string;
  taskId: Id<"agentTasks">;
  projectId: Id<"projects"> | undefined;
  taskDescription: string | undefined;
  rootDirectory: string;
  changeRequests: string[];
  proofs: TaskPrProof[];
}): string {
  const sections = buildTaskPrSections(
    params.taskDescription,
    params.changeRequests,
    params.proofs,
  );
  const evaUrl = buildEvaTaskUrl(
    params.repoOwner,
    params.repoName,
    params.taskId,
    params.projectId,
    params.rootDirectory || undefined,
  );
  return buildPrBody(sections, evaUrl);
}

function buildTaskPullRequestLabels(params: {
  rootDirectory: string;
  isQuickTask: boolean;
}): string[] {
  return [
    "eva",
    params.isQuickTask ? "quick-task" : "project",
    ...(params.rootDirectory
      ? [params.rootDirectory.split("/").pop()].filter(
          (label): label is string => label !== undefined && label !== "",
        )
      : []),
  ];
}

async function findOpenPullRequestForBranch(params: {
  installationId: number;
  repoOwner: string;
  repoName: string;
  branchName: string;
}): Promise<{ url: string; number: number; body: string | null } | null> {
  const octokit = await getInstallationOctokit(params.installationId);
  const pulls = await octokit.rest.pulls.list({
    owner: params.repoOwner,
    repo: params.repoName,
    state: "open",
    head: `${params.repoOwner}:${params.branchName}`,
    per_page: 1,
  });
  const pr = pulls.data[0];
  if (!pr) return null;
  return { url: pr.html_url, number: pr.number, body: pr.body };
}

async function createPullRequestWithGitHub(
  args: PullRequestCreateParams,
): Promise<string> {
  const octokit = await getInstallationOctokit(args.installationId);
  const baseBranch = args.baseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const existingPr = await findOpenPullRequestForBranch(args);
  if (existingPr) {
    await octokit.rest.pulls.update({
      owner: args.repoOwner,
      repo: args.repoName,
      pull_number: existingPr.number,
      title: `Eva: ${args.title}`,
      body: args.body,
      base: baseBranch,
    });
    return existingPr.url;
  }

  await waitForPullRequestHead({
    octokit,
    repoOwner: args.repoOwner,
    repoName: args.repoName,
    branchName: args.branchName,
    baseBranch,
  });

  const pr = await octokit.rest.pulls.create({
    owner: args.repoOwner,
    repo: args.repoName,
    title: `Eva: ${args.title}`,
    body: args.body,
    head: args.branchName,
    base: baseBranch,
    draft: args.draft ?? false,
  });

  if (args.labels.length > 0) {
    try {
      await octokit.rest.issues.addLabels({
        owner: args.repoOwner,
        repo: args.repoName,
        issue_number: pr.data.number,
        labels: args.labels,
      });
    } catch (labelError) {
      console.error(
        `Failed to add labels to PR ${pr.data.html_url}: ${labelError instanceof Error ? labelError.message : String(labelError)}`,
      );
    }
  }

  return pr.data.html_url;
}

async function refreshPullRequestBodyWithGitHub(
  args: PullRequestRefreshParams,
): Promise<string> {
  const octokit = await getInstallationOctokit(args.installationId);
  const pr = await findOpenPullRequestForBranch(args);
  if (!pr) {
    throw new Error(
      `No open pull request found for ${args.repoOwner}/${args.repoName}:${args.branchName}`,
    );
  }

  const existingBody = pr.body ?? "";
  const auditMatch = existingBody.match(AUDIT_SECTION_REGEX);
  const newBody = auditMatch ? `${args.body}\n\n${auditMatch[0]}` : args.body;

  await octokit.rest.pulls.update({
    owner: args.repoOwner,
    repo: args.repoName,
    pull_number: pr.number,
    body: newBody,
  });
  return pr.url;
}

async function waitForPullRequestHead(params: {
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>;
  repoOwner: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
}): Promise<void> {
  let lastError = "";
  for (const delayMs of PR_READY_WAIT_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    try {
      const comparison =
        await params.octokit.rest.repos.compareCommitsWithBasehead({
          owner: params.repoOwner,
          repo: params.repoName,
          basehead: `${params.baseBranch}...${params.branchName}`,
          per_page: 1,
        });
      if (comparison.data.ahead_by > 0) {
        return;
      }
      lastError = `${params.branchName} is not ahead of ${params.baseBranch}`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "GitHub compare failed";
    }
  }
  throw new Error(
    `GitHub did not report ${params.branchName} as ready for a pull request after branch push: ${lastError}`,
  );
}

/** Manually creates the PR for a task branch — used when the workflow's auto
 * PR step failed. Idempotent: returns the existing PR URL if one is already
 * tracked on a run. The body matches the format the workflow would produce. */
export const createTaskPr = action({
  args: { taskId: v.id("agentTasks") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const data = await ctx.runQuery(
      internal.taskWorkflow.getTaskPrCreationData,
      { taskId: args.taskId },
    );

    if (data.existingPrUrl) {
      return { url: data.existingPrUrl };
    }

    const sections = buildTaskPrSections(
      data.taskDescription,
      data.changeRequests,
      data.proofs,
    );
    const evaUrl = buildEvaTaskUrl(
      data.repoOwner,
      data.repoName,
      args.taskId,
      data.projectId,
      data.rootDirectory || undefined,
    );
    const body = buildPrBody(sections, evaUrl);

    const labels = [
      "eva",
      data.isQuickTask ? "quick-task" : "project",
      ...(data.rootDirectory
        ? [data.rootDirectory.split("/").pop()].filter(
            (l): l is string => l !== undefined && l !== "",
          )
        : []),
    ];

    const prUrl: string = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: data.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        branchName: data.branchName,
        baseBranch: data.baseBranch,
        title: data.taskTitle,
        body,
        labels,
        draft: data.isQuickTask,
      },
    );

    if (data.latestRunId) {
      await ctx.runMutation(internal.taskWorkflow.setRunPrUrl, {
        runId: data.latestRunId,
        prUrl,
      });
    }

    return { url: prUrl };
  },
});

/** Manually creates the PR for a project branch — used when the workflow's
 * auto PR step (driven by the first task to complete) failed. Idempotent:
 * returns the existing PR URL if one is already tracked on the project. The
 * body summarises the project and lists tasks that have completed at least
 * one successful run, so users can recover even after multiple tasks have
 * landed without a PR. */
export const createProjectPr = action({
  args: { projectId: v.id("projects") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const data = await ctx.runQuery(
      internal.projects.getProjectPrCreationData,
      { projectId: args.projectId },
    );

    if (data.existingPrUrl) {
      return { url: data.existingPrUrl };
    }

    const sections = buildProjectPrSections(
      data.projectTitle,
      data.projectDescription,
      data.completedTasks,
    );
    const evaUrl = buildEvaProjectUrl(
      data.repoOwner,
      data.repoName,
      args.projectId,
      data.rootDirectory || undefined,
    );
    const body = buildPrBody(sections, evaUrl);

    const labels = [
      "eva",
      "project",
      ...(data.rootDirectory
        ? [data.rootDirectory.split("/").pop()].filter(
            (l): l is string => l !== undefined && l !== "",
          )
        : []),
    ];

    const prUrl: string = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: data.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        branchName: data.branchName,
        baseBranch: data.baseBranch,
        title: data.projectTitle,
        body,
        labels,
        draft: false,
      },
    );

    await ctx.runMutation(internal.projects.setProjectPrUrl, {
      projectId: args.projectId,
      prUrl,
    });

    return { url: prUrl };
  },
});

/** Creates a GitHub pull request via the installation Octokit and optionally adds labels. */
export const createPullRequest = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    labels: v.array(v.string()),
    draft: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (_ctx, args): Promise<string> => {
    return await createPullRequestWithGitHub(args);
  },
});

export const createTaskPullRequest = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.optional(v.string()),
    title: v.string(),
    taskId: v.id("agentTasks"),
    projectId: v.optional(v.id("projects")),
    taskDescription: v.optional(v.string()),
    rootDirectory: v.string(),
    changeRequests: v.array(v.string()),
    proofs: v.array(taskPrProofValidator),
    draft: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (_ctx, args): Promise<string> => {
    const isQuickTask = !args.projectId;
    return await createPullRequestWithGitHub({
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      title: args.title,
      body: buildTaskPullRequestBody({
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        taskId: args.taskId,
        projectId: args.projectId,
        taskDescription: args.taskDescription,
        rootDirectory: args.rootDirectory,
        changeRequests: args.changeRequests,
        proofs: args.proofs,
      }),
      labels: buildTaskPullRequestLabels({
        rootDirectory: args.rootDirectory,
        isQuickTask,
      }),
      draft: args.draft,
    });
  },
});

export const refreshTaskPullRequestBody = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskId: v.id("agentTasks"),
    projectId: v.optional(v.id("projects")),
    taskDescription: v.optional(v.string()),
    rootDirectory: v.string(),
    changeRequests: v.array(v.string()),
    proofs: v.array(taskPrProofValidator),
  },
  returns: v.string(),
  handler: async (_ctx, args): Promise<string> => {
    return await refreshPullRequestBodyWithGitHub({
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      body: buildTaskPullRequestBody({
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        taskId: args.taskId,
        projectId: args.projectId,
        taskDescription: args.taskDescription,
        rootDirectory: args.rootDirectory,
        changeRequests: args.changeRequests,
        proofs: args.proofs,
      }),
    });
  },
});

/** Converts an open PR back to draft. Uses GraphQL because GitHub's REST
 * pulls.update endpoint does not support flipping draft state. */
export const convertPrToDraft = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prNumber: v.number(),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      // Look up the PR's GraphQL node_id (GraphQL mutations need it).
      const { data: pr } = await octokit.rest.pulls.get({
        owner: args.repoOwner,
        repo: args.repoName,
        pull_number: args.prNumber,
      });
      if (pr.draft) return true; // already draft
      await octokit.graphql(
        `mutation($id: ID!) {
          convertPullRequestToDraft(input: { pullRequestId: $id }) {
            pullRequest { isDraft }
          }
        }`,
        { id: pr.node_id },
      );
      console.log(
        `[github] Converted PR #${args.prNumber} back to draft (${args.repoOwner}/${args.repoName})`,
      );
      return true;
    } catch (error) {
      console.error(
        `[github] Failed to convert PR to draft: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  },
});

/** Marks a draft PR as ready for review. Uses GraphQL because GitHub's REST
 * pulls.update endpoint silently ignores the draft field. */
export const markPrReadyForReview = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    prNumber: v.number(),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      const { data: pr } = await octokit.rest.pulls.get({
        owner: args.repoOwner,
        repo: args.repoName,
        pull_number: args.prNumber,
      });
      if (!pr.draft) return true; // already ready
      await octokit.graphql(
        `mutation($id: ID!) {
          markPullRequestReadyForReview(input: { pullRequestId: $id }) {
            pullRequest { isDraft }
          }
        }`,
        { id: pr.node_id },
      );
      console.log(
        `[github] Marked PR #${args.prNumber} as ready for review (${args.repoOwner}/${args.repoName})`,
      );
      return true;
    } catch (error) {
      console.error(
        `[github] Failed to mark PR ready: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  },
});

/** Appends or updates the audit section in an existing pull request body. */
export const appendAuditToPullRequest = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    auditResult: v.union(v.string(), v.null()),
    auditError: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      const pulls = await octokit.rest.pulls.list({
        owner: args.repoOwner,
        repo: args.repoName,
        state: "open",
        head: `${args.repoOwner}:${args.branchName}`,
        per_page: 1,
      });
      const pr = pulls.data[0];
      if (!pr) return null;

      const auditSection = buildAuditSection(args.auditResult, args.auditError);
      const updatedBody = mergeBodyWithAuditSection(
        pr.body ?? "",
        auditSection,
      );

      await octokit.rest.pulls.update({
        owner: args.repoOwner,
        repo: args.repoName,
        pull_number: pr.number,
        body: updatedBody,
      });
    } catch (error) {
      console.error(
        `Failed to append audit to PR: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  },
});

/** Updates an existing PR body while preserving any audit section. */
export const refreshPullRequestBody = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    body: v.string(),
  },
  returns: v.string(),
  handler: async (_ctx, args) => {
    return await refreshPullRequestBodyWithGitHub(args);
  },
});

/** Polls GitHub deployment status for a task run branch, scheduling retries until terminal or max attempts. */
export const pollDeploymentStatus = internalAction({
  args: {
    runId: v.id("agentRuns"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    branchName: v.string(),
    deploymentProjectName: v.optional(v.string()),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);

      const { data: branch } = await octokit.rest.repos.getBranch({
        owner: args.repoOwner,
        repo: args.repoName,
        branch: args.branchName,
      });
      const commitSha = branch.commit.sha;

      const { data: deployments } = await octokit.rest.repos.listDeployments({
        owner: args.repoOwner,
        repo: args.repoName,
        sha: commitSha,
        per_page: 10,
      });

      if (deployments.length === 0) {
        console.log(
          `[deployment-poll] No deployment found for ${args.repoOwner}/${args.repoName} branch=${args.branchName} sha=${commitSha} attempt=${args.attempt} project=${args.deploymentProjectName ?? "none"}`,
        );
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const projectNameLower = args.deploymentProjectName?.toLowerCase();
      const matchedDeployment = projectNameLower
        ? deployments.find((d) =>
            d.environment.toLowerCase().includes(projectNameLower),
          )
        : undefined;
      const targetDeployment = matchedDeployment ?? deployments[0];

      // If we have a project name filter but no match, keep polling instead of
      // falling back to an unrelated deployment (e.g. a faster-building monorepo app).
      if (projectNameLower && !matchedDeployment) {
        console.log(
          `[deployment-poll] ${deployments.length} deployment(s) found but none match project=${args.deploymentProjectName}, envs=[${deployments.map((d) => d.environment).join(", ")}], attempt=${args.attempt}`,
        );
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const { data: statuses } =
        await octokit.rest.repos.listDeploymentStatuses({
          owner: args.repoOwner,
          repo: args.repoName,
          deployment_id: targetDeployment.id,
          per_page: 1,
        });

      if (statuses.length === 0) {
        console.log(
          `[deployment-poll] Deployment ${targetDeployment.id} found but no statuses yet, attempt=${args.attempt} project=${args.deploymentProjectName ?? "none"}`,
        );
        await ctx.runMutation(internal.agentRuns.updateDeploymentStatus, {
          runId: args.runId,
          deploymentStatus: "queued",
        });
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const latestStatus = statuses[0];
      const mappedStatus = mapGitHubDeploymentState(latestStatus.state);
      const perCommitUrl =
        latestStatus.environment_url || latestStatus.target_url || undefined;

      const { url: deploymentUrl, shouldKeepPolling } =
        await resolveStableDeploymentUrl(
          ctx,
          args.repoId,
          perCommitUrl,
          args.attempt,
        );

      console.log(
        `[deployment-poll] ${args.repoOwner}/${args.repoName} branch=${args.branchName}: deployment=${targetDeployment.id} env=${targetDeployment.environment} state=${latestStatus.state} mapped=${mappedStatus} url=${deploymentUrl ?? "none"} project=${args.deploymentProjectName ?? "none"} keepPolling=${shouldKeepPolling}`,
      );

      await ctx.runMutation(internal.agentRuns.updateDeploymentStatus, {
        runId: args.runId,
        deploymentStatus: mappedStatus,
        deploymentUrl,
      });

      // Keep polling if: (a) build isn't finished yet, or (b) build is done
      // but we're still waiting for Vercel to attach the stable branch alias.
      const shouldReschedule =
        !isTerminalDeploymentStatus(mappedStatus) || shouldKeepPolling;
      if (shouldReschedule && args.attempt < MAX_POLL_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.taskWorkflowActions.pollDeploymentStatus,
          { ...args, attempt: args.attempt + 1 },
        );
      }
    } catch (error) {
      console.error(
        `[deployment-poll] Error for ${args.repoOwner}/${args.repoName} branch=${args.branchName} attempt=${args.attempt}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (args.attempt < MAX_POLL_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.taskWorkflowActions.pollDeploymentStatus,
          { ...args, attempt: args.attempt + 1 },
        );
      }
    }
    return null;
  },
});

/** Polls GitHub deployment status for a session branch, scheduling retries until terminal or max attempts. */
export const pollSessionDeploymentStatus = internalAction({
  args: {
    sessionId: v.id("sessions"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    branchName: v.string(),
    deploymentProjectName: v.optional(v.string()),
    attempt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);

      const { data: branch } = await octokit.rest.repos.getBranch({
        owner: args.repoOwner,
        repo: args.repoName,
        branch: args.branchName,
      });
      const commitSha = branch.commit.sha;

      const { data: deployments } = await octokit.rest.repos.listDeployments({
        owner: args.repoOwner,
        repo: args.repoName,
        sha: commitSha,
        per_page: 10,
      });

      if (deployments.length === 0) {
        console.log(
          `[session-deployment-poll] No deployment found for ${args.repoOwner}/${args.repoName} branch=${args.branchName} sha=${commitSha} attempt=${args.attempt} project=${args.deploymentProjectName ?? "none"}`,
        );
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollSessionDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const projectNameLower = args.deploymentProjectName?.toLowerCase();
      const matchedDeployment = projectNameLower
        ? deployments.find((d) =>
            d.environment.toLowerCase().includes(projectNameLower),
          )
        : undefined;
      const targetDeployment = matchedDeployment ?? deployments[0];

      // If we have a project name filter but no match, keep polling instead of
      // falling back to an unrelated deployment (e.g. a faster-building monorepo app).
      if (projectNameLower && !matchedDeployment) {
        console.log(
          `[session-deployment-poll] ${deployments.length} deployment(s) found but none match project=${args.deploymentProjectName}, envs=[${deployments.map((d) => d.environment).join(", ")}], attempt=${args.attempt}`,
        );
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollSessionDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const { data: statuses } =
        await octokit.rest.repos.listDeploymentStatuses({
          owner: args.repoOwner,
          repo: args.repoName,
          deployment_id: targetDeployment.id,
          per_page: 1,
        });

      if (statuses.length === 0) {
        console.log(
          `[session-deployment-poll] Deployment ${targetDeployment.id} found but no statuses yet, attempt=${args.attempt} project=${args.deploymentProjectName ?? "none"}`,
        );
        await ctx.runMutation(internal.sessions.updateDeploymentStatus, {
          sessionId: args.sessionId,
          deploymentStatus: "queued",
        });
        if (args.attempt < MAX_POLL_ATTEMPTS) {
          await ctx.scheduler.runAfter(
            POLL_INTERVAL_MS,
            internal.taskWorkflowActions.pollSessionDeploymentStatus,
            { ...args, attempt: args.attempt + 1 },
          );
        }
        return null;
      }

      const latestStatus = statuses[0];
      const mappedStatus = mapGitHubDeploymentState(latestStatus.state);
      const perCommitUrl =
        latestStatus.environment_url || latestStatus.target_url || undefined;

      const { url: deploymentUrl, shouldKeepPolling } =
        await resolveStableDeploymentUrl(
          ctx,
          args.repoId,
          perCommitUrl,
          args.attempt,
        );

      console.log(
        `[session-deployment-poll] ${args.repoOwner}/${args.repoName} branch=${args.branchName}: deployment=${targetDeployment.id} env=${targetDeployment.environment} state=${latestStatus.state} mapped=${mappedStatus} url=${deploymentUrl ?? "none"} project=${args.deploymentProjectName ?? "none"} keepPolling=${shouldKeepPolling}`,
      );

      await ctx.runMutation(internal.sessions.updateDeploymentStatus, {
        sessionId: args.sessionId,
        deploymentStatus: mappedStatus,
        deploymentUrl,
      });

      // Keep polling if: (a) build isn't finished yet, or (b) build is done
      // but we're still waiting for Vercel to attach the stable branch alias.
      const shouldReschedule =
        !isTerminalDeploymentStatus(mappedStatus) || shouldKeepPolling;
      if (shouldReschedule && args.attempt < MAX_POLL_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.taskWorkflowActions.pollSessionDeploymentStatus,
          { ...args, attempt: args.attempt + 1 },
        );
      }
    } catch (error) {
      console.error(
        `[session-deployment-poll] Error for ${args.repoOwner}/${args.repoName} branch=${args.branchName} attempt=${args.attempt}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (args.attempt < MAX_POLL_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          POLL_INTERVAL_MS,
          internal.taskWorkflowActions.pollSessionDeploymentStatus,
          { ...args, attempt: args.attempt + 1 },
        );
      }
    }
    return null;
  },
});
