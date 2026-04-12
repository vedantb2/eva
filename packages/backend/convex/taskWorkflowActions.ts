"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getInstallationOctokit } from "./githubAuth";
import { deploymentStatusValidator } from "./validators";
import { extractJsonBlock } from "./_taskWorkflow/helpers";

type AuditRow = {
  requirement: string;
  passed: boolean;
  detail: string;
};

type AuditSection = {
  name: string;
  results: AuditRow[];
};

type ParsedAudit = {
  sections?: AuditSection[];
  accessibility?: AuditRow[];
  testing?: AuditRow[];
  codeReview?: AuditRow[];
  summary?: string;
};

const AUDIT_SECTION_REGEX =
  /<!-- EVA_AUDIT_START -->[\s\S]*?<!-- EVA_AUDIT_END -->\s*/m;

/** Escapes pipe characters and newlines so a string is safe for a markdown table cell. */
function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

/** Builds the markdown audit section from parsed audit results or an error message. */
function buildAuditSection(
  result: string | null,
  error: string | null,
): string {
  const lines: string[] = [
    "<!-- EVA_AUDIT_START -->",
    "## Post-Execution Audit",
    "",
  ];

  if (error) {
    lines.push(`Audit failed: ${escapeTableCell(error)}`);
    lines.push("<!-- EVA_AUDIT_END -->");
    return lines.join("\n");
  }

  if (!result) {
    lines.push("Audit unavailable.");
    lines.push("<!-- EVA_AUDIT_END -->");
    return lines.join("\n");
  }

  try {
    const parsed = JSON.parse(extractJsonBlock(result)) as ParsedAudit;
    const rows: Array<[string, AuditRow]> = [];

    if (parsed.sections && Array.isArray(parsed.sections)) {
      for (const section of parsed.sections) {
        for (const row of section.results ?? []) {
          rows.push([section.name, row]);
        }
      }
    } else {
      for (const row of parsed.accessibility ?? [])
        rows.push(["Accessibility", row]);
      for (const row of parsed.testing ?? []) rows.push(["Testing", row]);
      for (const row of parsed.codeReview ?? [])
        rows.push(["Code Review", row]);
    }

    if (parsed.summary) {
      lines.push(`Summary: ${escapeTableCell(parsed.summary)}`);
      lines.push("");
    }

    lines.push("| Section | Requirement | Passed | Detail |");
    lines.push("| --- | --- | --- | --- |");

    if (rows.length === 0) {
      lines.push("| - | - | - | No audit checks returned |");
    } else {
      for (const [section, row] of rows) {
        const status = row.passed ? "PASS" : "FAIL";
        lines.push(
          `| ${section} | ${escapeTableCell(row.requirement)} | ${status} | ${escapeTableCell(row.detail)} |`,
        );
      }
    }
  } catch {
    lines.push("Audit parsing failed.");
  }

  lines.push("<!-- EVA_AUDIT_END -->");
  return lines.join("\n");
}

/** Merges a new audit section into an existing PR body, replacing any previous audit block. */
function mergeBodyWithAuditSection(
  existingBody: string,
  auditSection: string,
): string {
  const stripped = existingBody.replace(AUDIT_SECTION_REGEX, "").trim();
  return stripped ? `${stripped}\n\n${auditSection}` : auditSection;
}

/** Assembles a pull request body from an array of heading/content sections. */
export function buildPrBody(
  sections: Array<{ heading: string; content: string }>,
): string {
  const parts: string[] = [];
  for (const section of sections) {
    parts.push(`## ${section.heading}`);
    parts.push(section.content);
    parts.push("");
  }
  parts.push("---");
  parts.push("*Created by Eva AI Agent*");
  return parts.join("\n");
}

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
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, args) => {
    try {
      const octokit = await getInstallationOctokit(args.installationId);
      const pr = await octokit.rest.pulls.create({
        owner: args.repoOwner,
        repo: args.repoName,
        title: `Eva: ${args.title}`,
        body: args.body,
        head: args.branchName,
        base: args.baseBranch ?? "staging",
      });

      if (args.labels.length > 0) {
        await octokit.rest.issues.addLabels({
          owner: args.repoOwner,
          repo: args.repoName,
          issue_number: pr.data.number,
          labels: args.labels,
        });
      }

      return pr.data.html_url;
    } catch (error) {
      console.error(
        `Failed to create PR: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
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

/** Builds enriched PR body sections from proof and change request data. */
function buildEnrichedPrSections(params: {
  taskDescription: string | undefined;
  proofs: Array<{
    url: string | null;
    fileName?: string;
    message?: string;
    contentType: string | null;
  }>;
  changeRequests: string[];
}): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];

  sections.push({
    heading: "Task",
    content: params.taskDescription ?? "No description",
  });

  if (params.changeRequests.length > 0) {
    const editLines = params.changeRequests.map(
      (req, i) => `${i + 1}. ${escapeTableCell(req)}`,
    );
    sections.push({
      heading: "Edits Requested",
      content: editLines.join("\n"),
    });
  }

  const mediaProofs = params.proofs.filter((p) => p.url && p.contentType);
  const messageProofs = params.proofs.filter(
    (p) => p.message && p.message.trim().length > 0,
  );

  if (mediaProofs.length > 0 || messageProofs.length > 0) {
    const proofLines: string[] = [];

    for (const proof of mediaProofs) {
      if (!proof.url) continue;
      const label = proof.fileName ?? "Proof";
      const isImage = proof.contentType?.startsWith("image/") ?? false;
      if (isImage) {
        proofLines.push(`![${label}](${proof.url})`);
      } else {
        proofLines.push(`[${label}](${proof.url})`);
      }
    }

    for (const proof of messageProofs) {
      if (proof.message) {
        proofLines.push(`> ${escapeTableCell(proof.message)}`);
      }
    }

    sections.push({
      heading: "Proof of Completion",
      content: proofLines.join("\n\n"),
    });
  }

  return sections;
}

const PROOF_EDITS_REGEX =
  /<!-- EVA_PROOF_EDITS_START -->[\s\S]*?<!-- EVA_PROOF_EDITS_END -->\s*/m;

/** Builds the proof/edits block wrapped in boundary markers. */
function buildProofEditsBlock(
  sections: Array<{ heading: string; content: string }>,
): string {
  const lines: string[] = ["<!-- EVA_PROOF_EDITS_START -->"];
  for (const section of sections) {
    lines.push(`## ${section.heading}`);
    lines.push(section.content);
    lines.push("");
  }
  lines.push("---");
  lines.push("*Created by Eva AI Agent*");
  lines.push("<!-- EVA_PROOF_EDITS_END -->");
  return lines.join("\n");
}

/** Updates an existing PR body with enriched proof, edits, and task description sections. */
export const updatePullRequestBody = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    taskDescription: v.optional(v.string()),
    proofs: v.array(
      v.object({
        url: v.union(v.string(), v.null()),
        fileName: v.optional(v.string()),
        message: v.optional(v.string()),
        contentType: v.union(v.string(), v.null()),
      }),
    ),
    changeRequests: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const hasProofs = args.proofs.some(
      (p) => (p.url && p.contentType) || (p.message && p.message.trim()),
    );
    const hasEdits = args.changeRequests.length > 0;

    if (!hasProofs && !hasEdits) return null;

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

      const enrichedSections = buildEnrichedPrSections({
        taskDescription: args.taskDescription,
        proofs: args.proofs,
        changeRequests: args.changeRequests,
      });

      const proofEditsBlock = buildProofEditsBlock(enrichedSections);

      const existingBody = pr.body ?? "";

      // Extract existing audit block to preserve it
      const auditMatch = existingBody.match(AUDIT_SECTION_REGEX);
      const auditBlock = auditMatch ? auditMatch[0].trim() : null;

      // Replace entire body with enriched content, preserving audit block
      const newBody = auditBlock
        ? `${proofEditsBlock}\n\n${auditBlock}`
        : proofEditsBlock;

      await octokit.rest.pulls.update({
        owner: args.repoOwner,
        repo: args.repoName,
        pull_number: pr.number,
        body: newBody,
      });
    } catch (error) {
      console.error(
        `Failed to update PR body: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  },
});

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 60_000;

type DeploymentStatus = typeof deploymentStatusValidator.type;

/** Maps a GitHub deployment state string to the internal DeploymentStatus enum. */
function mapGitHubDeploymentState(state: string): DeploymentStatus {
  switch (state) {
    case "queued":
      return "queued";
    case "pending":
    case "in_progress":
    case "waiting":
      return "building";
    case "success":
      return "deployed";
    case "error":
    case "failure":
    case "inactive":
      return "error";
    default:
      return "building";
  }
}

/** Checks whether a deployment status is a final state (deployed or error). */
function isTerminalDeploymentStatus(status: DeploymentStatus): boolean {
  return status === "deployed" || status === "error";
}

/** Polls GitHub deployment status for a task run branch, scheduling retries until terminal or max attempts. */
export const pollDeploymentStatus = internalAction({
  args: {
    runId: v.id("agentRuns"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
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
      const targetDeployment = projectNameLower
        ? (deployments.find((d) =>
            d.environment.toLowerCase().includes(projectNameLower),
          ) ?? deployments[0])
        : deployments[0];

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
      const deploymentUrl =
        latestStatus.environment_url || latestStatus.target_url || undefined;

      console.log(
        `[deployment-poll] ${args.repoOwner}/${args.repoName} branch=${args.branchName}: deployment=${targetDeployment.id} env=${targetDeployment.environment} state=${latestStatus.state} mapped=${mappedStatus} url=${deploymentUrl ?? "none"} project=${args.deploymentProjectName ?? "none"}`,
      );

      await ctx.runMutation(internal.agentRuns.updateDeploymentStatus, {
        runId: args.runId,
        deploymentStatus: mappedStatus,
        deploymentUrl,
      });

      if (
        !isTerminalDeploymentStatus(mappedStatus) &&
        args.attempt < MAX_POLL_ATTEMPTS
      ) {
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
      const targetDeployment = projectNameLower
        ? (deployments.find((d) =>
            d.environment.toLowerCase().includes(projectNameLower),
          ) ?? deployments[0])
        : deployments[0];

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
      const deploymentUrl =
        latestStatus.environment_url || latestStatus.target_url || undefined;

      console.log(
        `[session-deployment-poll] ${args.repoOwner}/${args.repoName} branch=${args.branchName}: deployment=${targetDeployment.id} env=${targetDeployment.environment} state=${latestStatus.state} mapped=${mappedStatus} url=${deploymentUrl ?? "none"} project=${args.deploymentProjectName ?? "none"}`,
      );

      await ctx.runMutation(internal.sessions.updateDeploymentStatus, {
        sessionId: args.sessionId,
        deploymentStatus: mappedStatus,
        deploymentUrl,
      });

      if (
        !isTerminalDeploymentStatus(mappedStatus) &&
        args.attempt < MAX_POLL_ATTEMPTS
      ) {
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
