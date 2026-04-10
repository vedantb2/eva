import { v } from "convex/values";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { aiModelValidator } from "./validators";
import { taskCompleteEvent } from "./_taskWorkflow/events";
import { buildPrBody } from "./taskWorkflowActions";
import { buildRootDirectoryInstruction } from "./prompts/shared";
import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";

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

function buildReadOnlyPrompt(
  title: string,
  description: string,
  rootDirectory: string,
): string {
  return `You are in READ-ONLY / REPORT MODE. Do NOT modify any files, do NOT commit, do NOT push, do NOT create branches or PRs.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read and analyze the codebase to answer the prompt
2. You may run read-only commands (e.g. grep, find, cat, ls, git log, git diff, npm test, npm run build) to gather information
3. Write a detailed report/analysis as your final output

## Report (REQUIRED):
Provide a clear, structured report answering the prompt. This is the only output — no code changes.

## Rules:
- Do NOT edit, write, or create any files
- Do NOT run git add, git commit, git push, or any git commands that modify state
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Prefix shell commands with timeouts: \`timeout 60 npm run build\`, \`timeout 60 npm test\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

function buildActionableReportPrompt(
  title: string,
  description: string,
  rootDirectory: string,
): string {
  return `You are in READ-ONLY / REPORT MODE with STRUCTURED FINDINGS. Do NOT modify any files, do NOT commit, do NOT push, do NOT create branches or PRs.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read and analyze the codebase to answer the prompt
2. You may run read-only commands (e.g. grep, find, cat, ls, git log, git diff, npm test, npm run build) to gather information
3. Identify discrete, actionable findings
4. Output your findings as structured JSON (see format below)

## Findings Output (REQUIRED):
At the END of your response, output a JSON array of findings inside a fenced code block, preceded by the marker \`<!-- FINDINGS_JSON -->\`.

Each finding must have:
- \`title\`: short summary of the issue (1 line)
- \`description\`: detailed explanation of the issue
- \`severity\`: one of "low", "medium", "high", "critical"
- \`filePaths\`: array of relevant file paths (optional but preferred)
- \`suggestedFix\`: how to fix this issue (optional but preferred)

Example:
<!-- FINDINGS_JSON -->
\`\`\`json
[
  {
    "title": "Unhandled null reference in UserService",
    "description": "The getUserById method does not handle the case where the user is not found, leading to a null reference error.",
    "severity": "high",
    "filePaths": ["src/services/UserService.ts"],
    "suggestedFix": "Add a null check after the database query and return an appropriate error response."
  }
]
\`\`\`

You may include narrative text before the JSON block for context, but the JSON block MUST appear at the end.

## Rules:
- Do NOT edit, write, or create any files
- Do NOT run git add, git commit, git push, or any git commands that modify state
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Prefix shell commands with timeouts: \`timeout 60 npm run build\`, \`timeout 60 npm test\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

interface ParsedFinding {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  filePaths?: string[];
  suggestedFix?: string;
}

type Severity = ParsedFinding["severity"];

const VALID_SEVERITIES: Record<string, Severity> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFindingsFromResult(resultText: string): ParsedFinding[] | null {
  const markerIdx = resultText.indexOf("<!-- FINDINGS_JSON -->");
  if (markerIdx === -1) return null;

  const afterMarker = resultText.slice(markerIdx);
  const jsonMatch = afterMarker.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[1].trim());
    if (!Array.isArray(parsed)) return null;

    const findings: ParsedFinding[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item: unknown = parsed[i];
      if (!isRecord(item)) continue;

      const title = item.title;
      const description = item.description;
      const severityRaw = item.severity;

      if (typeof title !== "string" || typeof description !== "string")
        continue;
      if (typeof severityRaw !== "string") continue;

      const severity = VALID_SEVERITIES[severityRaw];
      if (!severity) continue;

      const finding: ParsedFinding = {
        id: `finding-${String(i)}`,
        title,
        description,
        severity,
      };

      if (
        Array.isArray(item.filePaths) &&
        item.filePaths.every((fp: unknown) => typeof fp === "string")
      ) {
        const paths: string[] = [];
        for (const fp of item.filePaths) {
          if (typeof fp === "string") paths.push(fp);
        }
        finding.filePaths = paths;
      }

      if (typeof item.suggestedFix === "string") {
        finding.suggestedFix = item.suggestedFix;
      }

      findings.push(finding);
    }
    return findings.length > 0 ? findings : null;
  } catch {
    return null;
  }
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
    model: aiModelValidator,
    rootDirectory: v.string(),
    userId: v.id("users"),
    readOnly: v.optional(v.boolean()),
    actionsEnabled: v.optional(v.boolean()),
  },
  handler: async (step, args): Promise<void> => {
    let sandboxId: string | undefined;
    let completionPrUrl: string | null = null;
    const isReadOnly = args.readOnly === true;
    const isActionable = isReadOnly && args.actionsEnabled === true;

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

      const prompt = isActionable
        ? buildActionableReportPrompt(
            args.title,
            args.description,
            args.rootDirectory,
          )
        : isReadOnly
          ? buildReadOnlyPrompt(
              args.title,
              args.description,
              args.rootDirectory,
            )
          : buildAutomationPrompt(
              args.title,
              args.description,
              args.branchName,
              args.rootDirectory,
            );

      const streamingEntityId = `automation-run-${String(args.runId)}`;

      sandboxId = await prepareSandboxSteps(step, {
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        ephemeral: true,
        repoId: args.repoId,
        streamingEntityId,
        baseBranch: data.defaultBaseBranch ?? "main",
        branchName: isReadOnly ? undefined : args.branchName,
        createRetry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 },
      });

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
        allowedTools: isReadOnly
          ? "Read,Bash,Glob,Grep"
          : "Read,Write,Edit,Bash,Glob,Grep",
        repoId: args.repoId,
        streamingEntityId,
        runId: String(args.runId),
      });

      const result = await step.awaitEvent(taskCompleteEvent);

      if (result.success && !isReadOnly) {
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

      const findings =
        isActionable && result.success
          ? parseFindingsFromResult(result.result ?? "")
          : null;

      await step.runMutation(internal.automations.updateRunStatus, {
        runId: args.runId,
        status: result.success ? "success" : "error",
        error: result.success ? undefined : (result.error ?? "Unknown error"),
        resultSummary: result.result ?? undefined,
        prUrl: completionPrUrl ?? undefined,
        activityLog: result.activityLog ?? undefined,
        findings: findings ?? undefined,
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
        } catch (cleanupError) {
          console.error("Failed to cleanup sandbox:", cleanupError);
        }
      }
    } finally {
      await step.runMutation(internal.automations.clearRunWorkflow, {
        runId: args.runId,
      });
    }
  },
});
