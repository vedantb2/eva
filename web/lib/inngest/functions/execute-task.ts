import { inngest } from "../client";
import { Sandbox } from "e2b";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

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

      const sbx = await Sandbox.create("anthropic-claude-code", {
        apiKey: serverEnv.E2B_API_KEY,
        envs: {
          ANTHROPIC_API_KEY: serverEnv.ANTHROPIC_API_KEY,
          GITHUB_TOKEN: freshToken,
        },
        timeoutMs: 60 * 60 * 1000,
      });

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Cloning ${repo.owner}/${repo.name}...`,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      try {
        await sbx.commands.run(`git clone ${repoUrl} ~/workspace`, {
          timeoutMs: 120000,
        });
      } catch (err) {
        const error = err as { stderr?: string; message?: string };
        throw new Error(
          `Git clone failed: ${
            error.stderr || error.message || "Unknown error"
          }`
        );
      }

      const branchName =
        task.branchName || `conductor/task-${task.taskNumber || Date.now()}`;
      await sbx.commands.run(
        `cd ~/workspace && git checkout -b ${branchName}`,
        {
          timeoutMs: 30000,
        }
      );

      await sbx.commands.run(
        'git config --global user.name "Conductor Agent" && git config --global user.email "agent@conductor.dev"',
        { timeoutMs: 10000 }
      );

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Created branch: ${branchName}`,
      });

      return { sandboxId: sbx.sandboxId, branchName };
    });

    const agentResult = await step.run("run-autonomous-agent", async () => {
      const sbx = await Sandbox.connect(sandboxData.sandboxId, {
        apiKey: serverEnv.E2B_API_KEY,
      });

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "AI agent executing task...",
      });

      const prompt = `IMPORTANT: You are in IMPLEMENTATION MODE, not planning mode. Do NOT create plan files or markdown documentation. DIRECTLY edit the actual source code files.

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
        )}\\n\\n---\\n*Implemented by Conductor AI Agent*","head":"${
        sandboxData.branchName
      }","base":"main"}'
7. Extract the "html_url" from the curl response - that is the PR URL
8. Output ONLY this JSON at the very end: {"success": true, "prUrl": "<PR_URL>"}

## CRITICAL RULES:
- Do NOT create any .md files or plan files
- Do NOT run any build, lint, test, or dev commands
- Do NOT ask questions - make reasonable assumptions and implement
- DIRECTLY edit source code files (.ts, .js, .py, .tsx, .jsx, etc.)
- Do NOT default to npm. Use the repository’s lockfile (pnpm-lock.yaml, yarn.lock, package-lock.json, or bun.lockb) to determine the correct package manager
- Make minimal, focused changes to existing files
- The GITHUB_TOKEN environment variable is already set for git push and curl`;

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let result;
      try {
        result = await sbx.commands.run(
          `cd ~/workspace && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model claude-haiku-4-5-20251001 --allowedTools "Read,Write,Edit,Bash,Glob,Grep" --output-format json`,
          { timeoutMs: 0 }
        );
      } catch (err) {
        const error = err as {
          stderr?: string;
          stdout?: string;
          message?: string;
        };
        const errorDetails =
          error.stderr || error.stdout || error.message || "Unknown error";
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Claude agent error: ${errorDetails.slice(0, 500)}`,
        });
        throw new Error(`Claude agent failed: ${errorDetails}`);
      }

      const output = result.stdout || "";

      let agentOutput: AgentOutput = { success: false, error: "Unknown error" };
      try {
        const jsonResponse = JSON.parse(output);
        const resultText = jsonResponse.result || "";
        const prUrlMatch = resultText.match(
          /"html_url":\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
        );
        if (prUrlMatch) {
          agentOutput = { success: true, prUrl: prUrlMatch[1] };
        } else {
          const jsonMatch = resultText.match(
            /\{"success":\s*(true|false)[^}]*"prUrl":\s*"([^"]+)"[^}]*\}/
          );
          if (jsonMatch && jsonMatch[2]) {
            agentOutput = { success: true, prUrl: jsonMatch[2] };
          }
        }
      } catch {
        const prUrlMatch = output.match(
          /"html_url":\s*"(https:\/\/github\.com\/[^"]+\/pull\/\d+)"/
        );
        if (prUrlMatch) {
          agentOutput = { success: true, prUrl: prUrlMatch[1] };
        }
      }

      if (!agentOutput.success || !agentOutput.prUrl) {
        await convex.mutation(api.agentRuns.appendLogNoAuth, {
          id: runId as Id<"agentRuns">,
          level: "error",
          message: `Agent output: ${output.slice(-1000)}`,
        });
        throw new Error(
          `Agent failed: ${agentOutput.error || "No PR URL found in output"}`
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
        const sbx = await Sandbox.connect(sandboxData.sandboxId, {
          apiKey: serverEnv.E2B_API_KEY,
        });
        await sbx.kill();
      } catch {
        // Sandbox may already be terminated
      }
    });

    return { success: true, prUrl: agentResult.prUrl };
  }
);
