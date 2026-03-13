import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { claudeModelValidator } from "./validators";
import { taskCompleteEvent } from "./_taskWorkflow/events";
import { buildPrBody } from "./taskWorkflowActions";
import { buildRootDirectoryInstruction } from "./prompts/shared";

function buildAutomationPrompt(
  title: string,
  description: string,
  branchName: string,
  rootDirectory: string,
): string {
  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read the files you plan to modify before editing them — understand existing code first
2. Implement changes by editing source code files
3. Run the build command to verify no build errors. If errors, fix and re-run (max 3 attempts — if still failing, commit what you have and report the error)
4. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "automation: ${title.replace(/"/g, '\\"')}"
5. Run: git push -u origin ${branchName}

## Summary (REQUIRED):
After pushing, write a brief summary of the changes you made. This will be added to the PR description.

## Rules:
- Do NOT create .md plan files or run lint/dev commands (except the build step above)
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with timeouts: \`timeout 120 npm install\`, \`timeout 60 npm run build\`, \`timeout 60 npm test\`, \`timeout 30 gh ...\`
- For gh: \`GH_PROMPT_DISABLED=1 timeout 30 gh ...\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

export const automationExecutionWorkflow = workflow.define({
  args: {
    runId: v.id("automationRuns"),
    automationId: v.id("automations"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.string(),
    description: v.string(),
    title: v.string(),
    model: claudeModelValidator,
    rootDirectory: v.string(),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    let sandboxId: string | undefined;
    let completionPrUrl: string | null = null;

    try {
      await step.runMutation(internal.automations.updateRunStatus, {
        runId: args.runId,
        status: "running",
      });

      const data = await step.runQuery(internal.automations.getAutomationData, {
        automationId: args.automationId,
        repoId: args.repoId,
      });
      if (!data) throw new Error("Automation data not found");

      const prompt = buildAutomationPrompt(
        args.title,
        args.description,
        args.branchName,
        args.rootDirectory,
      );

      const setupResult = await step.runAction(
        internal.daytona.prepareSandbox,
        {
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: args.branchName,
          baseBranch: data.defaultBaseBranch,
          ephemeral: true,
          repoId: args.repoId,
          streamingEntityId: `automation-run-${String(args.runId)}`,
        },
        { retry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = setupResult.sandboxId;

      await step.runMutation(internal.automations.updateRunStatus, {
        runId: args.runId,
        status: "running",
        sandboxId,
      });

      await step.runAction(internal.daytona.launchOnExistingSandbox, {
        sandboxId,
        entityId: String(args.runId),
        prompt,
        userId: args.userId,
        completionMutation: "automations:handleCompletion",
        entityIdField: "automationRunId",
        model: args.model,
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        repoId: args.repoId,
        streamingEntityId: `automation-run-${String(args.runId)}`,
        runId: String(args.runId),
      });

      const result = await step.awaitEvent(taskCompleteEvent);

      if (result.success) {
        completionPrUrl = await step.runAction(
          internal.taskWorkflowActions.createPullRequest,
          {
            installationId: args.installationId,
            repoOwner: data.repoOwner,
            repoName: data.repoName,
            branchName: args.branchName,
            baseBranch: data.defaultBaseBranch,
            title: args.title,
            body: buildPrBody([
              {
                heading: "Automation",
                content: args.description || "No description",
              },
              {
                heading: "Summary",
                content: result.result ?? "No summary provided",
              },
            ]),
            labels: [
              "eva",
              "automation",
              ...(args.rootDirectory
                ? [args.rootDirectory.split("/").pop()].filter(
                    (l): l is string => l !== undefined && l !== "",
                  )
                : []),
            ],
          },
        );
      }

      await step.runMutation(internal.automations.updateRunStatus, {
        runId: args.runId,
        status: result.success ? "success" : "error",
        error: result.success ? undefined : (result.error ?? "Unknown error"),
        resultSummary: result.result ?? undefined,
        prUrl: completionPrUrl ?? undefined,
        activityLog: result.activityLog ?? undefined,
      });

      if (sandboxId) {
        await step.runAction(internal.daytona.deleteSandbox, {
          sandboxId,
          repoId: args.repoId,
        });
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Automation workflow failed";
      await step.runMutation(internal.automations.updateRunStatus, {
        runId: args.runId,
        status: "error",
        error: msg,
      });

      if (sandboxId) {
        try {
          await step.runAction(internal.daytona.deleteSandbox, {
            sandboxId,
            repoId: args.repoId,
          });
        } catch {}
      }
    } finally {
      await step.runMutation(internal.automations.clearRunWorkflow, {
        runId: args.runId,
      });
    }
  },
});
