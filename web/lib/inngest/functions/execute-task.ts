import { inngest } from "../client";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import { createSandbox, getSandbox } from "../sandbox";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

interface AgentOutput {
  success: boolean;
  prUrl?: string;
  error?: string;
  completedSubtasks?: number[];
}

async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const sandbox = await getSandbox(sandboxId);
    await sandbox.process.executeCommand("echo alive", "/", undefined, 10);
    return true;
  } catch {
    return false;
  }
}

export const executeTask = inngest.createFunction(
  {
    id: "execute-task",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { runId: string } };
      };
      const runId = eventData.event.data.runId as Id<"agentRuns">;
      await convex.mutation(api.agentRuns.completeNoAuth, {
        id: runId,
        success: false,
        error: error.message,
      });
    },
  },
  { event: "task/execute.requested" },
  async ({ event, step }) => {
    const { runId, taskId, repoId, installationId, projectId, branchName, isFirstTaskOnBranch } = event.data;

    const { task, repo, project, subtasks } = await step.run("fetch-task-data", async () => {
      const taskData = await convex.query(api.agentTasks.getNoAuth, {
        id: taskId,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId,
      });
      if (!taskData || !repoData) {
        throw new Error("Task or repo not found");
      }
      const projectData = projectId
        ? await convex.query(api.projects.getNoAuth, { id: projectId })
        : null;
      const subtaskData = await convex.query(api.subtasks.listByTaskNoAuth, {
        parentTaskId: taskId,
      });
      return { task: taskData, repo: repoData, project: projectData, subtasks: subtaskData };
    });

    await step.run("update-status-running", async () => {
      await convex.mutation(api.agentRuns.updateStatusNoAuth, {
        id: runId as Id<"agentRuns">,
        status: "running",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(installationId);
      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      const taskBranchName = branchName || `conductor/task-${task.taskNumber || Date.now()}`;

      if (project?.sandboxId) {
        const alive = await isSandboxAlive(project.sandboxId);
        if (alive) {
          await convex.mutation(api.agentRuns.appendLogNoAuth, {
            id: runId as Id<"agentRuns">,
            level: "info",
            message: `Reusing existing sandbox: ${project.sandboxId}`,
          });

          const sandbox = await getSandbox(project.sandboxId);
          await sandbox.process.executeCommand(
            `cd ~/workspace && git fetch origin && git pull origin ${taskBranchName}`,
            "/",
            undefined,
            60
          );

          await convex.mutation(api.projects.updateLastSandboxActivityNoAuth, {
            id: projectId as Id<"projects">,
          });

          return { sandboxId: project.sandboxId, branchName: taskBranchName, isFirstTaskOnBranch, reused: true };
        }
      }

      const sandbox = await createSandbox(freshToken);

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Cloning ${repo.owner}/${repo.name}...`,
      });

      try {
        await sandbox.process.executeCommand(
          `git clone ${repoUrl} ~/workspace`,
          "/",
          undefined,
          120
        );
      } catch (err) {
        const error = err as { result?: string; message?: string };
        throw new Error(
          `Git clone failed: ${error.result || error.message || "Unknown error"}`
        );
      }

      if (isFirstTaskOnBranch) {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git checkout -b ${taskBranchName}`,
          "/",
          undefined,
          30
        );
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Created branch: ${taskBranchName}`,
        });
      } else {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git fetch origin && git checkout ${taskBranchName} && git pull origin ${taskBranchName}`,
          "/",
          undefined,
          30
        );
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Checked out existing branch: ${taskBranchName}`,
        });
      }

      await sandbox.process.executeCommand(
        'git config --global user.name "Eva Agent" && git config --global user.email "agent@Eva.dev"',
        "/",
        undefined,
        10
      );

      if (projectId) {
        await convex.mutation(api.projects.updateSandboxNoAuth, {
          id: projectId as Id<"projects">,
          sandboxId: sandbox.id,
        });
      }

      return { sandboxId: sandbox.id, branchName: taskBranchName, isFirstTaskOnBranch, reused: false };
    });

    const agentResult = await step.run("run-autonomous-agent", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "AI agent executing task...",
      });

      const subtasksList = subtasks.length > 0
        ? `\n## Subtasks (mark completed indices in your output):\n${subtasks.map((s, i) => `${i}. ${s.title}`).join("\n")}`
        : "";

      const prInstructions = sandboxData.isFirstTaskOnBranch
        ? `6. Run this curl command to create a PR:
   curl -X POST "https://api.github.com/repos/${repo.owner}/${repo.name}/pulls" -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" -d '{"title":"${task.title.replace(/'/g, "\\'")}","body":"## Task\\n${(task.description || "No description").replace(/\n/g, "\\n").replace(/'/g, "\\'")}\\n\\n---\\n*Implemented by Eva AI Agent*","head":"${sandboxData.branchName}","base":"main"}'
7. Extract the "html_url" from the curl response - that is the PR URL
8. Output ONLY this JSON at the very end: {"success": true, "prUrl": "<PR_URL>", "completedSubtasks": [<indices of completed subtasks>]}`
        : `6. Output ONLY this JSON at the very end: {"success": true, "completedSubtasks": [<indices of completed subtasks>]}`;

      const prompt = `IMPORTANT: You are in IMPLEMENTATION MODE, not planning mode. Do NOT create plan files or markdown documentation. DIRECTLY edit the actual source code files. Spend some time thinking about the changes you need to make before you start so you don't make mistakes.

## Task: ${task.title}
## Task Number: ${task.taskNumber || 1}

## Description: ${task.description || "No description provided"}
${subtasksList}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${sandboxData.branchName}

## Required Steps (execute ALL of these):
1. Read the CLAUDE.md file to understand the codebase - use Glob and Read tools to explore the codebase and find relevant files if CLAUDE.md is not available
2. Use Edit or Write tools to DIRECTLY modify the actual source code files (NOT create .md files)
3. Update the CLAUDE.md file to reflect any major changes you made to the codebase
4. Run: git add -A && git commit -m "feat(task-${task.taskNumber || 1}): ${task.title}"
5. Run: git push -u origin ${sandboxData.branchName}
${prInstructions}

## CRITICAL RULES:
- Do NOT create any .md files or plan files
- Do NOT run any build, lint, test, or dev commands
- Do NOT ask questions - make reasonable assumptions and implement
- DIRECTLY edit source code files (.ts, .js, .py, .tsx, .jsx, etc.)
- Do NOT default to npm. Use the repository's lockfile (pnpm-lock.yaml, yarn.lock, package-lock.json, or bun.lockb) to determine the correct package manager
- Make minimal, focused changes to existing files
- The GITHUB_TOKEN environment variable is already set for git push and curl
- Include completedSubtasks in your final JSON output with the indices of subtasks you completed`;

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let result;
      try {
        result = await sandbox.process.executeCommand(
          `cd ~/workspace && npx -y npm@11.7.0 install && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model opus --allowedTools "Read,Write,Edit,Bash,Glob,Grep" --output-format json`,
          "/",
          undefined,
          0
        );
      } catch (err) {
        const error = err as {
          result?: string;
          message?: string;
        };
        const errorOutput = (error.result || "").trim();
        const errorDetails = errorOutput.slice(-500) || error.message || "Unknown error";
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Claude agent error: ${errorDetails.slice(0, 1000)}`,
        });
        throw new Error(`Claude agent failed: ${errorDetails}`);
      }

      const output = result.result || "";

      let agentOutput: AgentOutput = {
        success: false,
        error: sandboxData.isFirstTaskOnBranch ? "No PR URL found" : "Task failed",
      };

      const jsonStartIndex = output.indexOf('{"type":"result"');
      const jsonStr =
        jsonStartIndex >= 0 ? output.slice(jsonStartIndex) : output;

      try {
        const jsonResponse = JSON.parse(jsonStr);
        const resultText = jsonResponse.result || "";
        if (jsonResponse.is_error) {
          agentOutput.error = resultText || "Claude returned an error";
        } else if (sandboxData.isFirstTaskOnBranch) {
          const prUrlMatch = resultText.match(
            /"?prUrl"?\s*:\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
          );
          if (prUrlMatch) {
            agentOutput = { success: true, prUrl: prUrlMatch[1] };
          } else {
            const htmlUrlMatch = resultText.match(
              /"html_url":\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
            );
            if (htmlUrlMatch) {
              agentOutput = { success: true, prUrl: htmlUrlMatch[1] };
            }
          }
        } else {
          const successMatch = resultText.match(/"success"\s*:\s*true/);
          if (successMatch) {
            agentOutput = { success: true };
          }
        }

        const completedMatch = resultText.match(/"completedSubtasks"\s*:\s*\[([^\]]*)\]/);
        if (completedMatch && completedMatch[1]) {
          const indices = completedMatch[1].split(",").map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
          agentOutput.completedSubtasks = indices;
        }
      } catch {
        if (sandboxData.isFirstTaskOnBranch) {
          const prUrlMatch = output.match(
            /"prUrl":\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
          );
          if (prUrlMatch) {
            agentOutput = { success: true, prUrl: prUrlMatch[1] };
          }
        } else {
          const successMatch = output.match(/"success"\s*:\s*true/);
          if (successMatch) {
            agentOutput = { success: true };
          }
        }

        const completedMatch = output.match(/"completedSubtasks"\s*:\s*\[([^\]]*)\]/);
        if (completedMatch && completedMatch[1]) {
          const indices = completedMatch[1].split(",").map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
          agentOutput.completedSubtasks = indices;
        }
      }

      if (!agentOutput.success) {
        const truncatedOutput = output.slice(-1500);
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Agent output: ${truncatedOutput}`,
        });
        throw new Error(
          `Agent failed: ${agentOutput.error} | Output: ${truncatedOutput.slice(0, 500)}`
        );
      }

      if (sandboxData.isFirstTaskOnBranch && !agentOutput.prUrl) {
        const truncatedOutput = output.slice(-1500);
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Agent output: ${truncatedOutput}`,
        });
        throw new Error(`Agent failed: No PR URL found | Output: ${truncatedOutput.slice(0, 500)}`);
      }

      if (sandboxData.isFirstTaskOnBranch) {
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `PR created: ${agentOutput.prUrl}`,
        });
      } else {
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Commit pushed to project branch: ${sandboxData.branchName}`,
        });
      }

      return {
        prUrl: agentOutput.prUrl,
        branchName: sandboxData.branchName,
        isFirstTaskOnBranch: sandboxData.isFirstTaskOnBranch,
        completedSubtasks: agentOutput.completedSubtasks || [],
      };
    });

    await step.run("mark-subtasks-completed", async () => {
      if (agentResult.completedSubtasks.length > 0) {
        await convex.mutation(api.subtasks.markCompletedNoAuth, {
          parentTaskId: taskId as Id<"agentTasks">,
          completedIndices: agentResult.completedSubtasks,
        });
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Marked ${agentResult.completedSubtasks.length} subtasks as completed`,
        });
      }
    });

    await step.run("complete-run", async () => {
      if (agentResult.isFirstTaskOnBranch && agentResult.prUrl && projectId) {
        await convex.mutation(api.projects.updatePrUrlNoAuth, {
          id: projectId as Id<"projects">,
          prUrl: agentResult.prUrl,
        });
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Project PR created: ${agentResult.prUrl}`,
        });
      } else {
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "info",
          message: `Commit pushed to branch: ${agentResult.branchName}`,
        });
      }

      if (projectId) {
        await convex.mutation(api.projects.updateLastSandboxActivityNoAuth, {
          id: projectId as Id<"projects">,
        });
      }

      await convex.mutation(api.agentRuns.completeNoAuth, {
        id: runId as Id<"agentRuns">,
        success: true,
        resultSummary: agentResult.isFirstTaskOnBranch
          ? "Created project PR"
          : "Pushed commit to project branch",
      });
    });

    return { success: true, prUrl: agentResult.prUrl };
  }
);
