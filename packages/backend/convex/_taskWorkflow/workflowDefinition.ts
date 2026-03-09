import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { claudeModelValidator } from "../validators";
import {
  taskCompleteEvent,
  auditCompleteEvent,
  auditFixCompleteEvent,
} from "./events";
import {
  buildAuditPrompt,
  buildAuditFixPrompt,
  extractAuditFailures,
  WORKSPACE_DIR,
} from "./prompts";
import { buildIssueRetryDelayMs } from "./recovery";
import { getTaskRunStreamingEntityId } from "./helpers";

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

      const setupResult = await step.runAction(
        internal.daytona.prepareSandbox,
        {
          existingSandboxId: data.projectSandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName,
          baseBranch: args.baseBranch,
          ephemeral: !args.projectId,
          repoId: args.repoId,
          attachRunId: args.runId,
          streamingEntityId: getTaskRunStreamingEntityId(args.runId),
        },
        { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = setupResult.sandboxId;

      await step.runAction(internal.daytona.launchOnExistingSandbox, {
        sandboxId,
        entityId: String(args.taskId),
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "taskWorkflow:handleCompletion",
        entityIdField: "taskId",
        model: args.model ?? "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        repoId: args.repoId,
        streamingEntityId: getTaskRunStreamingEntityId(args.runId),
        runId: String(args.runId),
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
              args.projectId ? "project" : "issue",
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

      const auditCategories = data.auditCategories;

      if (result.success && sandboxId && auditCategories.length > 0) {
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
              prompt: buildAuditPrompt(diffRaw, auditCategories),
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

            if (auditResult.success && auditResult.result) {
              const failures = extractAuditFailures(auditResult.result);
              if (failures.length > 0) {
                try {
                  const fixPrompt = buildAuditFixPrompt(
                    failures,
                    data.branchName,
                    data.rootDirectory,
                  );

                  await step.runAction(internal.daytona.launchAuditFix, {
                    sandboxId,
                    prompt: fixPrompt,
                    taskId: String(args.taskId),
                    runId: args.runId,
                    userId: args.userId,
                    repoId: args.repoId,
                  });

                  await step.awaitEvent(auditFixCompleteEvent);
                } catch (fixErr) {
                  console.error("Audit fix step failed:", fixErr);
                }
              }
            }

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
            internal.taskWorkflow.maybeScheduleIssueRetry,
            {
              taskId: args.taskId,
              runId: args.runId,
              error: result.error ?? undefined,
              delayMs: buildIssueRetryDelayMs(),
            },
          );
        } catch (retryError) {
          console.error("Failed to schedule issue auto-retry:", retryError);
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
            internal.taskWorkflow.maybeScheduleIssueRetry,
            {
              taskId: args.taskId,
              runId: args.runId,
              error: fallbackError ?? undefined,
              delayMs: buildIssueRetryDelayMs(),
            },
          );
        } catch (retryError) {
          console.error("Failed to schedule issue auto-retry:", retryError);
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
