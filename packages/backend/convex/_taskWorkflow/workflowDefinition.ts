import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { claudeModelValidator } from "../validators";
import { taskCompleteEvent, auditCompleteEvent } from "./events";
import { buildAuditPrompt, WORKSPACE_DIR } from "./prompts";
import { buildQuickTaskRetryDelayMs } from "./recovery";

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
    model: v.optional(claudeModelValidator),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    let sandboxId: string | undefined;
    let hasSubtasks = false;
    let completionSuccess: boolean | undefined;
    let completionError: string | null = null;
    let completionPrUrl: string | null = null;
    let completionActivityLog: string | null = null;
    let runCompletionRecorded = false;
    let runFinalized = false;
    let sandboxDeleted = false;
    let deleteSandboxOnFailure = false;

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
      });
      hasSubtasks = data.hasSubtasks;

      const acquireResult = await step.runAction(
        internal.daytona.acquireExecutionSandbox,
        {
          existingSandboxId: data.projectSandboxId,
          installationId: args.installationId,
          repoId: args.repoId,
          ephemeral: !args.projectId,
          attachRunId: args.runId,
          entityIdField: "taskId",
        },
        { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = acquireResult.sandboxId;
      deleteSandboxOnFailure = acquireResult.deleteSandboxOnFailure;

      await step.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.runId,
        sandboxId,
      });

      await step.runAction(internal.daytona.prepareExecutionSandbox, {
        sandboxId,
        isNewSandbox: acquireResult.isNewSandbox,
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        repoId: args.repoId,
        snapshotName: acquireResult.snapshotName,
        branchName: data.branchName,
        baseBranch: args.baseBranch,
      });

      await step.runAction(internal.daytona.launchExecutionOnSandbox, {
        sandboxId,
        repoId: args.repoId,
        prompt: data.prompt,
        completionMutation: "taskWorkflow:handleCompletion",
        entityIdField: "taskId",
        userId: args.userId,
        entityId: String(args.taskId),
        model: args.model ?? "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        attachRunId: args.runId,
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

      if (result.success) {
        await step.runMutation(
          internal.taskWorkflow.scheduleDeploymentTracking,
          {
            runId: args.runId,
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            branchName: data.branchName,
          },
        );
      }

      if (args.isFirstTaskOnBranch && result.success) {
        completionPrUrl = await step.runAction(
          internal.taskWorkflowActions.createPullRequest,
          {
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            branchName: data.branchName,
            baseBranch: args.baseBranch,
            title: data.taskTitle,
            description: data.taskDescription,
            labels: [
              "eva",
              args.projectId ? "project" : "quick-task",
              ...(data.appLabel ? [data.appLabel] : []),
            ],
          },
        );
      }

      await step.runMutation(internal.taskWorkflow.finalizeRunStreamingPhase, {
        runId: args.runId,
        taskId: args.taskId,
        projectId: args.projectId,
        success: result.success,
        error: result.error,
        prUrl: completionPrUrl,
        activityLog: result.activityLog,
      });
      runCompletionRecorded = true;

      if (result.success && sandboxId && data.postAuditEnabled) {
        try {
          const diffRaw = await step.runAction(
            internal.daytona.runSandboxCommand,
            {
              sandboxId,
              command: `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
              timeoutSeconds: 30,
              repoId: args.repoId,
            },
          );

          if (diffRaw.trim()) {
            const auditId = await step.runMutation(
              internal.taskWorkflow.createAudit,
              {
                taskId: args.taskId,
                runId: args.runId,
              },
            );

            await step.runAction(internal.daytona.launchAudit, {
              sandboxId,
              prompt: buildAuditPrompt(diffRaw),
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
          }
        } catch (err) {
          console.error("Audit step failed:", err);
        }
      }

      await step.runMutation(internal.taskWorkflow.completeRun, {
        runId: args.runId,
        taskId: args.taskId,
        projectId: args.projectId,
        success: result.success,
        error: result.error,
        prUrl: completionPrUrl,
        hasSubtasks: data.hasSubtasks,
        activityLog: result.activityLog,
      });
      runFinalized = true;

      if (!args.projectId && !result.success) {
        try {
          await step.runMutation(
            internal.taskWorkflow.maybeScheduleQuickTaskRetry,
            {
              taskId: args.taskId,
              runId: args.runId,
              error: result.error ?? undefined,
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
          hasSubtasks,
          activityLog: completionActivityLog,
          exitReason: fallbackExitReason,
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

      const sandboxIdForCleanup =
        sandboxId &&
        !sandboxDeleted &&
        (!args.projectId ||
          (deleteSandboxOnFailure && completionSuccess === undefined))
          ? sandboxId
          : undefined;
      if (sandboxIdForCleanup) {
        try {
          await step.runAction(internal.daytona.deleteSandbox, {
            sandboxId: sandboxIdForCleanup,
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
