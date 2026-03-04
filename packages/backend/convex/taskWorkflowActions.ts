"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getInstallationOctokit } from "./githubAuth";
import { deploymentStatusValidator } from "./validators";

type AuditRow = {
  requirement: string;
  passed: boolean;
  detail: string;
};

type ParsedAudit = {
  accessibility?: AuditRow[];
  testing?: AuditRow[];
  codeReview?: AuditRow[];
  summary?: string;
};

const AUDIT_SECTION_REGEX =
  /<!-- EVA_AUDIT_START -->[\s\S]*?<!-- EVA_AUDIT_END -->\s*/m;

function extractJsonBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch?.[1]) return codeBlockMatch[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

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
    for (const row of parsed.accessibility ?? [])
      rows.push(["Accessibility", row]);
    for (const row of parsed.testing ?? []) rows.push(["Testing", row]);
    for (const row of parsed.codeReview ?? []) rows.push(["Code Review", row]);

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

function mergeBodyWithAuditSection(
  existingBody: string,
  auditSection: string,
): string {
  const stripped = existingBody.replace(AUDIT_SECTION_REGEX, "").trim();
  return stripped ? `${stripped}\n\n${auditSection}` : auditSection;
}

export const createPullRequest = internalAction({
  args: {
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
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
        body: `## Task\n${args.description || "No description"}\n\n---\n*Implemented by Eva AI Agent*`,
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

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 60_000;

type DeploymentStatus = typeof deploymentStatusValidator.type;

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

function isTerminalDeploymentStatus(status: DeploymentStatus): boolean {
  return status === "deployed" || status === "error";
}

export const pollDeploymentStatus = internalAction({
  args: {
    runId: v.id("agentRuns"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
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
        per_page: 1,
      });

      if (deployments.length === 0) {
        console.log(
          `[deployment-poll] No deployment found for ${args.repoOwner}/${args.repoName} branch=${args.branchName} sha=${commitSha} attempt=${args.attempt}`,
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
          deployment_id: deployments[0].id,
          per_page: 1,
        });

      if (statuses.length === 0) {
        console.log(
          `[deployment-poll] Deployment ${deployment.id} found but no statuses yet, attempt=${args.attempt}`,
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
        `[deployment-poll] ${args.repoOwner}/${args.repoName} branch=${args.branchName}: state=${latestStatus.state} mapped=${mappedStatus} url=${deploymentUrl ?? "none"}`,
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
