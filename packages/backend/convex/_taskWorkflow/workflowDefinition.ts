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
import { buildPrBody, buildTaskPrSections } from "../prBody";
import { buildEvaTaskUrl } from "./urls";
import { buildQuickTaskRetryDelayMs } from "./recovery";
import { getTaskRunStreamingEntityId } from "./helpers";
import { prepareSandboxSteps } from "../_daytona/prepareSandboxSteps";

const PR_STEP_RETRY = {
  retry: { maxAttempts: 3, initialBackoffMs: 2000, base: 2 },
};

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
    let sandboxStopped = false;
    let preserveSandboxOnFailure = false;

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
      // Reuse the persisted sandbox for project tasks (project.sandboxId) or
      // for quick tasks on follow-up runs (task.sandboxId — set after the first
      // run completes). Quick-task sandboxes are persistent (stop/pause, not
      // delete-on-completion — see "Persistent Quick-Task Sandboxes" in the
      // changelog), so `ephemeral` is always false: a first run that ended up
      // ephemeral would be deleted by Daytona on auto-stop, leaving
      // `task.sandboxId` as a tombstone and breaking the reviewer preview.
      const reusableSandboxId =
        data.projectSandboxId ?? data.taskSandboxId ?? undefined;
      sandboxId = await prepareSandboxSteps(step, {
        existingSandboxId: reusableSandboxId,
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        ephemeral: false,
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
      } else {
        // Quick tasks: persist sandbox on the task itself so reviewer Start
        // Sandbox and follow-up runs (resolve_conflicts, change-requests)
        // resume the same paused filesystem instead of bootstrapping anew.
        await step.runMutation(internal.taskWorkflow.saveTaskSandboxId, {
          taskId: args.taskId,
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

      if (finalSuccess && sandboxId) {
        try {
          await step.runAction(internal.daytona.pushSandboxBranch, {
            sandboxId,
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            repoId: args.repoId,
            branchName: data.branchName,
          });
        } catch (error) {
          preserveSandboxOnFailure = true;
          finalSuccess = false;
          finalError = `Task committed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
        }
      }

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

        const prSections = buildTaskPrSections(
          data.taskDescription,
          enrichment.changeRequests,
          enrichment.proofs,
        );

        const evaUrl = buildEvaTaskUrl(
          data.repoOwner,
          data.repoName,
          args.taskId,
          args.projectId,
          data.rootDirectory || undefined,
        );
        const enrichedBody = buildPrBody(prSections, evaUrl);

        if (args.isFirstTaskOnBranch) {
          // Quick tasks land in business_review on completion; the PR should
          // mirror that by opening as draft. The user promotes it to ready
          // when they move the task to code_review.
          const isQuickTask = !args.projectId;
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
                isQuickTask ? "quick-task" : "project",
                ...(isQuickTask ? ["draft"] : []),
                ...(data.rootDirectory
                  ? [data.rootDirectory.split("/").pop()].filter(
                      (l): l is string => l !== undefined && l !== "",
                    )
                  : []),
              ],
              draft: isQuickTask,
            },
            PR_STEP_RETRY,
          );
        } else {
          completionPrUrl = await step.runAction(
            internal.taskWorkflowActions.refreshPullRequestBody,
            {
              installationId: args.installationId,
              repoOwner: data.repoOwner,
              repoName: data.repoName,
              branchName: data.branchName,
              body: enrichedBody,
            },
            PR_STEP_RETRY,
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

      // Stop (don't delete) the quick-task sandbox so the reviewer can resume
      // the same paused filesystem — DB state, generated artifacts, etc. —
      // when they click Start Sandbox or post a change-request. Daytona
      // auto-archives stopped sandboxes after 7 days idle (platform default).
      if (!args.projectId && sandboxId && !preserveSandboxOnFailure) {
        await step.runAction(internal.daytona.stopSandbox, {
          sandboxId,
          repoId: args.repoId,
        });
        await step.runMutation(internal.taskWorkflow.markTaskSandboxStopped, {
          taskId: args.taskId,
        });
        sandboxStopped = true;
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

      if (
        !args.projectId &&
        sandboxId &&
        !sandboxStopped &&
        !preserveSandboxOnFailure
      ) {
        try {
          await step.runAction(internal.daytona.stopSandbox, {
            sandboxId,
            repoId: args.repoId,
          });
          await step.runMutation(internal.taskWorkflow.markTaskSandboxStopped, {
            taskId: args.taskId,
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
