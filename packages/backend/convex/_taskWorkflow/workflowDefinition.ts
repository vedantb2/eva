import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import {
  aiModelValidator,
  DEFAULT_AI_MODEL,
  runModeValidator,
} from "../validators";
import { taskCompleteEvent, auditCompleteEvent } from "./events";
import { buildAuditPrompt } from "./prompts";
import { buildPrBody } from "../prBody";
import { buildEvaTaskUrl } from "./urls";
import { buildQuickTaskRetryDelayMs } from "./recovery";
import { getTaskRunStreamingEntityId } from "./helpers";
import { prepareSandboxSteps } from "../_daytona/prepareSandboxSteps";

/** Main durable workflow that orchestrates sandbox setup, task execution, audit, PR creation, and cleanup. */
export const taskExecutionWorkflow = workflow.define({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(aiModelValidator),
    userId: v.id("users"),
    mode: v.optional(runModeValidator),
  },
  handler: async (step, args): Promise<void> => {
    let sandboxId: string | undefined;
    let completionSuccess: boolean | undefined;
    let completionError: string | null = null;
    let completionPrUrl: string | null = null;
    let completionActivityLog: string | null = null;
    let completionResult: string | null = null;
    let finalSuccess = false;
    let finalError: string | null = null;
    let runCompletionRecorded = false;
    let runFinalized = false;
    let sandboxDeleted = false;

    try {
      await step.runMutation(internal.taskWorkflow.updateRunToRunning, {
        runId: args.runId,
        taskId: args.taskId,
        repoId: args.repoId,
      });

      const data = await step.runQuery(internal.taskWorkflow.getTaskData, {
        taskId: args.taskId,
        repoId: args.repoId,
        projectId: args.projectId,
        branchName: args.branchName,
        mode: args.mode,
      });
      sandboxId = await prepareSandboxSteps(step, {
        existingSandboxId: data.projectSandboxId,
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        ephemeral: !args.projectId,
        repoId: args.repoId,
        attachRunId: args.runId,
        streamingEntityId: getTaskRunStreamingEntityId(args.runId),
        baseBranch: args.baseBranch,
        branchName: data.branchName,
        createRetry: { maxAttempts: 3, initialBackoffMs: 2000, base: 2 },
      });

      await step.runAction(internal.daytona.launchOnExistingSandbox, {
        sandboxId,
        entityId: String(args.taskId),
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "taskWorkflow:handleCompletion",
        entityIdField: "taskId",
        model: args.model ?? DEFAULT_AI_MODEL,
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        repoId: args.repoId,
        streamingEntityId: getTaskRunStreamingEntityId(args.runId),
        runId: String(args.runId),
        taskProofCaptureEnabled: data.screenshotsVideosEnabled,
      });

      await step.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.runId,
        sandboxId,
      });

      if (args.projectId) {
        await step.runMutation(internal.taskWorkflow.updateProjectSandbox, {
          projectId: args.projectId,
          sandboxId,
        });
      }

      const result = await step.awaitEvent(taskCompleteEvent);
      completionSuccess = result.success;
      completionError = result.error;
      completionActivityLog = result.activityLog;
      completionResult = result.result;
      finalSuccess = result.success;
      finalError = result.error;

      // Agent pushes the branch directly via git push in the sandbox

      if (finalSuccess) {
        await step.runMutation(
          internal.taskWorkflow.scheduleDeploymentTracking,
          {
            runId: args.runId,
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            repoId: args.repoId,
            branchName: data.branchName,
            deploymentProjectName: data.deploymentProjectName,
          },
        );
      }

      if (finalSuccess) {
        const enrichment = await step.runQuery(
          internal.taskWorkflow.getPrEnrichmentData,
          { taskId: args.taskId },
        );

        const prSections: Array<{ heading: string; content: string }> = [
          {
            heading: "Task",
            content: data.taskDescription ?? "No description",
          },
        ];

        if (enrichment.changeRequests.length > 0) {
          prSections.push({
            heading: "Change Requests",
            content: enrichment.changeRequests
              .map((cr: string, i: number) => `${i + 1}. ${cr}`)
              .join("\n"),
          });
        }

        type ProofItem = {
          fileName: string | null;
          message: string | null;
          url: string | null;
          contentType: string | null;
        };

        if (enrichment.proofs.length > 0) {
          const proofLines = enrichment.proofs.map((p: ProofItem) => {
            if (p.message) return `- ${p.message}`;
            if (p.url) {
              const isImage = p.contentType?.startsWith("image/") ?? false;
              const isVideo = p.contentType?.startsWith("video/") ?? false;
              const name = p.fileName ?? "Proof";
              if (isImage) return `![${name}](${p.url})`;
              if (isVideo) return `- [${name}](${p.url}) (video)`;
              return `- [${name}](${p.url})`;
            }
            return `- ${p.fileName ?? "Proof attached"}`;
          });
          prSections.push({
            heading: "Proof",
            content: proofLines.join("\n"),
          });
        }

        const evaUrl = buildEvaTaskUrl(
          data.repoOwner,
          data.repoName,
          args.taskId,
          args.projectId,
        );
        const enrichedBody = buildPrBody(prSections, evaUrl);

        if (args.isFirstTaskOnBranch) {
          completionPrUrl = await step.runAction(
            internal.taskWorkflowActions.createPullRequest,
            {
              installationId: args.installationId,
              repoOwner: data.repoOwner,
              repoName: data.repoName,
              branchName: data.branchName,
              baseBranch: args.baseBranch,
              title: data.taskTitle,
              body: enrichedBody,
              labels: [
                "eva",
                args.projectId ? "project" : "quick-task",
                ...(data.rootDirectory
                  ? [data.rootDirectory.split("/").pop()].filter(
                      (l): l is string => l !== undefined && l !== "",
                    )
                  : []),
              ],
            },
          );
        } else {
          await step.runAction(
            internal.taskWorkflowActions.refreshPullRequestBody,
            {
              installationId: args.installationId,
              repoOwner: data.repoOwner,
              repoName: data.repoName,
              branchName: data.branchName,
              body: enrichedBody,
            },
          );
        }
      }

      await step.runMutation(internal.taskWorkflow.finalizeRunStreamingPhase, {
        runId: args.runId,
        taskId: args.taskId,
        projectId: args.projectId,
        success: finalSuccess,
        error: finalError,
        prUrl: completionPrUrl,
        activityLog: result.activityLog,
        claudeResult: result.result ?? undefined,
      });
      runCompletionRecorded = true;

      const auditCategories = data.auditCategories;

      if (
        finalSuccess &&
        sandboxId &&
        auditCategories.length > 0 &&
        args.projectId
      ) {
        try {
          const auditId = await step.runMutation(
            internal.taskWorkflow.createAudit,
            {
              taskId: args.taskId,
              runId: args.runId,
            },
          );

          await step.runAction(internal.daytona.launchAudit, {
            sandboxId,
            prompt: buildAuditPrompt(auditCategories),
            taskId: String(args.taskId),
            runId: args.runId,
            userId: args.userId,
            repoId: args.repoId,
          });

          const auditResult = await step.awaitEvent(auditCompleteEvent);

          await step.runMutation(internal.taskWorkflow.saveAuditResult, {
            auditId,
            result: auditResult.result,
            error: auditResult.success
              ? undefined
              : (auditResult.error ?? "Audit failed"),
            activityLog: auditResult.activityLog,
          });

          if (completionPrUrl) {
            await step.runAction(
              internal.taskWorkflowActions.appendAuditToPullRequest,
              {
                installationId: args.installationId,
                repoOwner: data.repoOwner,
                repoName: data.repoName,
                branchName: data.branchName,
                auditResult: auditResult.result,
                auditError: auditResult.success
                  ? null
                  : (auditResult.error ?? "Audit failed"),
              },
            );
          }
        } catch (err) {
          console.error("Audit step failed:", err);
        }
      }

      await step.runMutation(internal.taskWorkflow.completeRun, {
        runId: args.runId,
        taskId: args.taskId,
        projectId: args.projectId,
        success: finalSuccess,
        error: finalError,
        prUrl: completionPrUrl,
        activityLog: result.activityLog,
        mode: args.mode,
        claudeResult: result.result ?? undefined,
      });
      runFinalized = true;

      if (!args.projectId && !finalSuccess) {
        try {
          await step.runMutation(
            internal.taskWorkflow.maybeScheduleQuickTaskRetry,
            {
              taskId: args.taskId,
              runId: args.runId,
              error: finalError ?? undefined,
              delayMs: buildQuickTaskRetryDelayMs(),
            },
          );
        } catch (retryError) {
          console.error(
            "Failed to schedule quick-task auto-retry:",
            retryError,
          );
        }
      }

      if (!args.projectId && sandboxId) {
        await step.runAction(internal.daytona.deleteSandbox, {
          sandboxId,
          repoId: args.repoId,
        });
        sandboxDeleted = true;
      }
    } catch (error) {
      const workflowError =
        error instanceof Error ? error.message : "Task workflow failed";
      const fallbackSuccess = completionSuccess ?? false;
      const fallbackError = fallbackSuccess
        ? null
        : (completionError ?? workflowError);
      const fallbackExitReason = fallbackSuccess ? "completed" : "error";

      if (!runCompletionRecorded) {
        await step.runMutation(
          internal.taskWorkflow.finalizeRunStreamingPhase,
          {
            runId: args.runId,
            taskId: args.taskId,
            projectId: args.projectId,
            success: fallbackSuccess,
            error: fallbackError,
            prUrl: completionPrUrl,
            activityLog: completionActivityLog,
            exitReason: fallbackExitReason,
            claudeResult: completionResult ?? undefined,
          },
        );
      }

      if (!runFinalized) {
        await step.runMutation(internal.taskWorkflow.completeRun, {
          runId: args.runId,
          taskId: args.taskId,
          projectId: args.projectId,
          success: fallbackSuccess,
          error: fallbackError,
          prUrl: completionPrUrl,
          activityLog: completionActivityLog,
          exitReason: fallbackExitReason,
          mode: args.mode,
          claudeResult: completionResult ?? undefined,
        });
      }

      if (!args.projectId) {
        try {
          await step.runMutation(
            internal.taskWorkflow.maybeScheduleQuickTaskRetry,
            {
              taskId: args.taskId,
              runId: args.runId,
              error: fallbackError ?? undefined,
              delayMs: buildQuickTaskRetryDelayMs(),
            },
          );
        } catch (retryError) {
          console.error(
            "Failed to schedule quick-task auto-retry:",
            retryError,
          );
        }
      }

      if (!args.projectId && sandboxId && !sandboxDeleted) {
        try {
          await step.runAction(internal.daytona.deleteSandbox, {
            sandboxId,
            repoId: args.repoId,
          });
        } catch {}
      }
    } finally {
      await step.runMutation(internal.taskWorkflow.clearActiveWorkflow, {
        taskId: args.taskId,
      });
    }
  },
});
