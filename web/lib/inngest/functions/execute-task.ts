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
    const { runId, taskId, repoId, installationId } = event.data;

    const { task, repo } = await step.run("fetch-task-data", async () => {
      const taskData = await convex.query(api.agentTasks.getNoAuth, {
        id: taskId,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId,
      });
      if (!taskData || !repoData) {
        throw new Error("Task or repo not found");
      }
      return { task: taskData, repo: repoData };
    });

    await step.run("update-status-running", async () => {
      await convex.mutation(api.agentRuns.updateStatusNoAuth, {
        id: runId as Id<"agentRuns">,
        status: "running",
      });
    });

    const sandboxData = await step.run("create-sandbox-and-clone", async () => {
      const freshToken = await getGitHubToken(installationId);

      const sandbox = await createSandbox(freshToken);

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Cloning ${repo.owner}/${repo.name}...`,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
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

      const branchName =
        task.branchName || `conductor/task-${task.taskNumber || Date.now()}`;
      await sandbox.process.executeCommand(
        `cd ~/workspace && git checkout -b ${branchName}`,
        "/",
        undefined,
        30
      );

      await sandbox.process.executeCommand(
        'git config --global user.name "Eva Agent" && git config --global user.email "agent@Eva.dev"',
        "/",
        undefined,
        10
      );

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Created branch: ${branchName}`,
      });

      return { sandboxId: sandbox.id, branchName };
    });

    const agentResult = await step.run("run-autonomous-agent", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "AI agent executing task...",
      });

      const prompt = `IMPORTANT: You are in IMPLEMENTATION MODE, not planning mode. Do NOT create plan files or markdown documentation. DIRECTLY edit the actual source code files. Spend some time thinking about the changes you need to make before you start so you don't make mistakes.

## Task: ${task.title}

## Description: ${task.description || "No description provided"}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${sandboxData.branchName}

## Required Steps (execute ALL of these):
1. Read the CLAUDE.md file to understand the codebase - use Glob and Read tools to explore the codebase and find relevant files if CLAUDE.md is not available
2. Use Edit or Write tools to DIRECTLY modify the actual source code files (NOT create .md files)
3. Update the CLAUDE.md file to reflect any major changes you made to the codebase
4. Run: git add -A && git commit -m "feat: ${task.title}"
5. Run: git push -u origin ${sandboxData.branchName}
6. Run this curl command to create a PR:
   curl -X POST "https://api.github.com/repos/${repo.owner}/${
        repo.name
      }/pulls" -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" -d '{"title":"${task.title.replace(
        /'/g,
        "\\'"
      )}","body":"## Task\\n${(task.description || "No description")
        .replace(/\n/g, "\\n")
        .replace(
          /'/g,
          "\\'"
        )}\\n\\n---\\n*Implemented by Eva AI Agent*","head":"${
        sandboxData.branchName
      }","base":"main"}'
7. Extract the "html_url" from the curl response - that is the PR URL
8. Output ONLY this JSON at the very end: {"success": true, "prUrl": "<PR_URL>"}

## CRITICAL RULES:
- Do NOT create any .md files or plan files
- Do NOT run any build, lint, test, or dev commands
- Do NOT ask questions - make reasonable assumptions and implement
- DIRECTLY edit source code files (.ts, .js, .py, .tsx, .jsx, etc.)
- Do NOT default to npm. Use the repository's lockfile (pnpm-lock.yaml, yarn.lock, package-lock.json, or bun.lockb) to determine the correct package manager
- Make minimal, focused changes to existing files
- The GITHUB_TOKEN environment variable is already set for git push and curl`;

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
        error: "No PR URL found",
      };

      const jsonStartIndex = output.indexOf('{"type":"result"');
      const jsonStr =
        jsonStartIndex >= 0 ? output.slice(jsonStartIndex) : output;

      try {
        const jsonResponse = JSON.parse(jsonStr);
        const resultText = jsonResponse.result || "";
        if (jsonResponse.is_error) {
          agentOutput.error = resultText || "Claude returned an error";
        }
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
      } catch {
        const prUrlMatch = output.match(
          /"prUrl":\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
        );
        if (prUrlMatch) {
          agentOutput = { success: true, prUrl: prUrlMatch[1] };
        }
      }

      if (!agentOutput.success || !agentOutput.prUrl) {
        const truncatedOutput = output.slice(-1500);
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Agent output: ${truncatedOutput}`,
        });
        throw new Error(
          `Agent failed: ${agentOutput.error} | Output: ${truncatedOutput.slice(
            0,
            500
          )}`
        );
      }

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `PR created: ${agentOutput.prUrl}`,
      });

      return { prUrl: agentOutput.prUrl, branchName: sandboxData.branchName };
    });

    await step.run("complete-run", async () => {
      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Pull request created: ${agentResult.prUrl}`,
      });

      await convex.mutation(api.agentRuns.completeNoAuth, {
        id: runId as Id<"agentRuns">,
        success: true,
        prUrl: agentResult.prUrl,
        resultSummary: "Successfully created PR",
      });
    });

    await step.run("cleanup-sandbox", async () => {
      try {
        const sandbox = await getSandbox(sandboxData.sandboxId);
        await sandbox.delete();
      } catch {
        // Sandbox may already be terminated
      }
    });

    return { success: true, prUrl: agentResult.prUrl };
  }
);
