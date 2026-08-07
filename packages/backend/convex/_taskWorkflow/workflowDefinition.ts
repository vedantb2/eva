import { v } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import {
  aiModelValidator,
  DEFAULT_AI_MODEL,
  runModeValidator,
} from "../validators";
import {
  taskCompleteEvent,
  auditCompleteEvent,
  proofCompleteEvent,
} from "./events";
import {
  buildAuditPrompt,
  buildProofPrompt,
  buildProofRetryPrompt,
} from "./prompts";
import { buildQuickTaskRetryDelayMs } from "./recovery";
import { getTaskRunStreamingEntityId } from "./helpers";
import { prepareSandboxSteps } from "../_sandbox_runtime/prepareSandboxSteps";

const PR_STEP_RETRY = {
  retry: { maxAttempts: 3, initialBackoffMs: 2000, base: 2 },
};

type PrEnrichmentData = FunctionReturnType<
  typeof internal.taskWorkflow.getPrEnrichmentData
>;

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
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    /** Entity owner for personal-credential decrypt (task.createdBy). */
    credentialOwnerUserId: v.optional(v.id("users")),
    userId: v.id("users"),
    mode: v.optional(runModeValidator),
  },
  handler: async (step, args): Promise<void> => {
    let sandboxId: string | undefined;

    let completionSuccess: boolean | undefined;
    let completionError: string | null = null;
    let completionPrUrl: string | null = null;
    let completionPrError: string | null = null;
    let completionActivityLog: string | null = null;
    let completionResult: string | null = null;
    let finalSuccess = false;
    let finalError: string | null = null;
    let runCompletionRecorded = false;
    let runFinalized = false;
    let sandboxStopped = false;
    let preserveSandboxOnFailure = false;
    let keepTaskSandboxActiveAfterRun = false;

    try {
      await step.runMutation(internal.taskWorkflow.updateRunToRunning, {
        runId: args.runId,
        taskId: args.taskId,
        repoId: args.repoId,
      });

      const data = await step.runQuery(internal.taskWorkflow.getTaskData, {
        taskId: args.taskId,
        repoId: args.repoId,
        runId: args.runId,
        projectId: args.projectId,
        branchName: args.branchName,
        mode: args.mode,
      });
      keepTaskSandboxActiveAfterRun = data.keepTaskSandboxActiveAfterRun;
      // Reuse the persisted sandbox for project tasks (project.sandboxId) or
      // for quick tasks on follow-up runs (task.sandboxId — set after the first
      // run completes). Quick-task sandboxes are persistent (stop/pause, not
      // delete-on-completion — see "Persistent Quick-Task Sandboxes" in the
      // changelog), so `ephemeral` is always false: a first run that ended up
      // ephemeral would be deleted on auto-stop, leaving
      // `task.sandboxId` as a tombstone and breaking the reviewer preview.
      const reusableSandboxId =
        data.projectSandboxId ?? data.taskSandboxId ?? undefined;
      const skipStartupCommands =
        args.projectId !== undefined &&
        reusableSandboxId !== undefined &&
        !args.isFirstTaskOnBranch;
      ({ sandboxId } = await prepareSandboxSteps(step, {
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
        skipStartupCommands,
        sessionPersistenceId: args.projectId,
        sessionPersistenceKind: args.projectId ? "projects" : undefined,
      }));

      // Always run implementation on the task's selected model. Proof capture
      // is a separate post-push step that uses repo.proofModel.
      await step.runAction(internal.sandbox.launchOnExistingSandbox, {
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
        taskProofCaptureEnabled: false,
        requireTaskCommit: true,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        // Read off the task doc rather than the workflow args so every entry
        // point (quick run, queued, scheduled, project build, auto-run from
        // findings) delivers the user's attachments without extra plumbing.
        attachmentStorageIds: data.attachmentStorageIds,
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

      console.log(
        `[task-workflow] run=${args.runId} taskId=${args.taskId} projectId=${args.projectId ?? "none"} agentSuccess=${finalSuccess} isFirstTaskOnBranch=${args.isFirstTaskOnBranch} branchName=${data.branchName} baseBranch=${args.baseBranch ?? "(default)"}`,
      );

      let pushedCommits = false;
      if (finalSuccess && sandboxId) {
        try {
          const pushResult = await step.runAction(
            internal.sandbox.pushSandboxBranch,
            {
              sandboxId,
              installationId: args.installationId,
              repoOwner: data.repoOwner,
              repoName: data.repoName,
              repoId: args.repoId,
              branchName: data.branchName,
            },
          );
          pushedCommits = pushResult.pushed;
        } catch (error) {
          preserveSandboxOnFailure = true;
          finalSuccess = false;
          finalError = `Task committed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
          console.error(
            `[task-workflow] run=${args.runId} pushSandboxBranch failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (finalSuccess) {
        try {
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
        } catch (deploymentError) {
          console.error(
            `[task-workflow] run=${args.runId} deployment tracking scheduling failed: ${deploymentError instanceof Error ? deploymentError.message : String(deploymentError)}`,
          );
        }
      }

      // Proof capture runs after push so PR enrichment can include media,
      // and uses repo.proofModel (falls back to the task model). Soft-fail
      // like audit. Retry once if the first turn left no media file.
      if (
        finalSuccess &&
        sandboxId &&
        data.screenshotsVideosEnabled &&
        args.mode !== "resolve_conflicts"
      ) {
        const proofModel = data.proofModel ?? args.model;
        const proofRuntime = {
          devPort: data.devPort,
          devCommand: data.devCommand,
        };
        try {
          // Revive Convex/etc. + start the app so proof does not screenshot
          // "function not found" / connection errors from a cold backend.
          await step.runAction(internal.sandbox.prepareProofSandbox, {
            sandboxId,
            repoId: args.repoId,
            taskId: args.taskId,
          });
          await step.runAction(internal.sandbox.launchProof, {
            sandboxId,
            prompt: buildProofPrompt(
              {
                title: data.taskTitle,
                description: data.taskDescription,
              },
              data.rootDirectory,
              completionResult,
              undefined,
              proofRuntime,
            ),
            taskId: String(args.taskId),
            runId: args.runId,
            userId: args.userId,
            repoId: args.repoId,
            model: proofModel,
            rootDirectory: data.rootDirectory,
          });
          const proofResult = await step.awaitEvent(proofCompleteEvent);
          if (!proofResult.success) {
            console.error(
              `[task-workflow] run=${args.runId} proof step failed: ${proofResult.error ?? "unknown"}`,
            );
          }

          // Prefer waiting briefly over an immediate retry — media used to land
          // after handleProofCompletion (race), which spuriously launched a
          // second full proof capture.
          const hasMedia = await step.runAction(
            internal.sandbox.waitForProofMedia,
            { taskId: args.taskId, runId: args.runId },
          );
          if (!hasMedia) {
            console.error(
              `[task-workflow] run=${args.runId} proof left no media; retrying once with hard capture prompt`,
            );
            await step.runMutation(
              internal.taskProof.clearMessageProofsForRun,
              { taskId: args.taskId, runId: args.runId },
            );
            await step.runAction(internal.sandbox.prepareProofSandbox, {
              sandboxId,
              repoId: args.repoId,
              taskId: args.taskId,
            });
            await step.runAction(internal.sandbox.launchProof, {
              sandboxId,
              prompt: buildProofRetryPrompt(
                {
                  title: data.taskTitle,
                  description: data.taskDescription,
                },
                data.rootDirectory,
                proofRuntime,
              ),
              taskId: String(args.taskId),
              runId: args.runId,
              userId: args.userId,
              repoId: args.repoId,
              model: proofModel,
              rootDirectory: data.rootDirectory,
            });
            const retryResult = await step.awaitEvent(proofCompleteEvent);
            if (!retryResult.success) {
              console.error(
                `[task-workflow] run=${args.runId} proof retry failed: ${retryResult.error ?? "unknown"}`,
              );
            }
          }
        } catch (proofError) {
          console.error(
            `[task-workflow] run=${args.runId} proof step failed: ${proofError instanceof Error ? proofError.message : String(proofError)}`,
          );
        }
      }

      // PR create/refresh only when this run actually pushed commits: a run
      // that published nothing has no diff to open or refresh a PR for, and
      // attempting one against a branch origin may not even have burned
      // compare retries into a spurious "PR creation failed" (404). Transient
      // failures still recover via the next pushing run or the Create PR button.
      if (finalSuccess && pushedCommits) {
        const createPrAsDraft = true;
        try {
          let changeRequests: PrEnrichmentData["changeRequests"] = [];
          let proofs: PrEnrichmentData["proofs"] = [];
          try {
            const enrichment = await step.runQuery(
              internal.taskWorkflow.getPrEnrichmentData,
              { taskId: args.taskId },
            );
            changeRequests = enrichment.changeRequests;
            proofs = enrichment.proofs;
          } catch (enrichmentError) {
            console.error(
              `[task-workflow] run=${args.runId} PR enrichment failed; creating PR with base body: ${enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError)}`,
            );
          }

          // Wrap PR creation/refresh in try/catch so a GitHub failure (closed PR
          // already exists, base branch missing, transient API error after retries)
          // does not bubble to the outer catch — which would silently flip the run
          // back to success: true with a null prUrl and no error, hiding the
          // failure from the user. Commits are already pushed; the manual
          // "Create PR" button is the recovery path.
          console.log(
            `[task-workflow] run=${args.runId} entering PR step path=${args.isFirstTaskOnBranch ? "create" : "refresh"}`,
          );
          const createPrArgs = {
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            branchName: data.branchName,
            baseBranch: args.baseBranch,
            title: data.taskTitle,
            taskId: args.taskId,
            projectId: args.projectId,
            taskDescription: data.taskDescription,
            rootDirectory: data.rootDirectory,
            changeRequests,
            proofs,
            draft: createPrAsDraft,
          };
          if (args.isFirstTaskOnBranch) {
            // Quick tasks land in business_review on completion; the PR should
            // mirror that by opening as draft. The user promotes it to ready
            // when they move the task to code_review.
            completionPrUrl = await step.runAction(
              internal.taskWorkflowActions.createTaskPullRequest,
              createPrArgs,
              PR_STEP_RETRY,
            );
          } else {
            // Subsequent runs: try to update the existing open PR body first.
            // If the previous PR was merged/closed, fall back to creating a
            // fresh PR so change-request runs still get a PR auto-created.
            try {
              completionPrUrl = await step.runAction(
                internal.taskWorkflowActions.refreshTaskPullRequestBody,
                {
                  installationId: args.installationId,
                  repoOwner: data.repoOwner,
                  repoName: data.repoName,
                  branchName: data.branchName,
                  taskId: args.taskId,
                  projectId: args.projectId,
                  taskDescription: data.taskDescription,
                  rootDirectory: data.rootDirectory,
                  changeRequests,
                  proofs,
                },
                PR_STEP_RETRY,
              );
            } catch {
              console.log(
                `[task-workflow] run=${args.runId} PR refresh failed (PR likely merged/closed), falling back to create`,
              );
              completionPrUrl = await step.runAction(
                internal.taskWorkflowActions.createTaskPullRequest,
                createPrArgs,
                PR_STEP_RETRY,
              );
            }
          }
        } catch (prError) {
          const action = args.isFirstTaskOnBranch ? "creation" : "refresh";
          completionPrError = `PR ${action} failed: ${prError instanceof Error ? prError.message : String(prError)}. Commits are pushed; use the Create PR button to recover.`;
          console.error(
            `PR ${action} failed for run ${args.runId}: ${completionPrError}`,
          );
        }
      }

      if (completionPrUrl) {
        try {
          await step.runMutation(
            internal._prRecapWorkflow.evaTrigger.scheduleEvaPrRecap,
            {
              repoId: args.repoId,
              userId: args.userId,
              prUrl: completionPrUrl,
            },
          );
        } catch (recapError) {
          console.error(
            `[task-workflow] run=${args.runId} scheduleEvaPrRecap failed: ${recapError instanceof Error ? recapError.message : String(recapError)}`,
          );
        }
      }

      // Surface a PR-step failure to the user even though the run is otherwise
      // successful — the commits are already on GitHub, so we keep success: true
      // (no auto-retry, no sandbox-preserve), but record the error in the
      // dedicated prError field so the UI can show what went wrong instead of
      // silently dropping it (the run-level `error` field is cleared on success
      // runs by finalizeRunStatus).
      await step.runMutation(internal.taskWorkflow.finalizeRunStreamingPhase, {
        runId: args.runId,
        taskId: args.taskId,
        projectId: args.projectId,
        success: finalSuccess,
        error: finalError,
        prError: completionPrError,
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
        data.runAuditEnabled
      ) {
        try {
          const auditId = await step.runMutation(
            internal.taskWorkflow.createAudit,
            {
              taskId: args.taskId,
              runId: args.runId,
            },
          );

          await step.runAction(internal.sandbox.launchAudit, {
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
        prError: completionPrError,
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

      // Stop (don't delete) quick-task sandboxes that were not already open in
      // the reviewer UI. If a change-request reused an active preview sandbox,
      // keep it active so "View Sandbox" continues pointing at a live sandbox.
      if (
        !args.projectId &&
        sandboxId &&
        !preserveSandboxOnFailure &&
        !keepTaskSandboxActiveAfterRun
      ) {
        await step.runAction(internal.sandbox.stopSandbox, {
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
            prError: completionPrError,
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
          prError: completionPrError,
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
        !preserveSandboxOnFailure &&
        !keepTaskSandboxActiveAfterRun
      ) {
        try {
          await step.runAction(internal.sandbox.stopSandbox, {
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
