import { inngest } from "../client";
import { Sandbox } from "e2b";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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

    const githubToken = await step.run("get-github-token", async () => {
      return getGitHubToken(installationId);
    });

    const { task, repo } = await step.run("fetch-task-data", async () => {
      const taskData = await convex.query(api.agentTasks.get, { id: taskId });
      const repoData = await convex.query(api.githubRepos.get, { id: repoId });
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
      const sbx = await Sandbox.create("anthropic-claude-code", {
        apiKey: serverEnv.E2B_API_KEY,
        envs: {
          ANTHROPIC_API_KEY: serverEnv.ANTHROPIC_API_KEY,
        },
        timeoutMs: 60 * 60 * 1000,
      });

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "Starting agent execution...",
      });

      const repoUrl = `https://x-access-token:${githubToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sbx.commands.run(`git clone ${repoUrl} /workspace`, {
        timeoutMs: 120000,
      });

      const branchName =
        task.branchName || `conductor/task-${task.taskNumber || Date.now()}`;
      await sbx.commands.run(`cd /workspace && git checkout -b ${branchName}`, {
        timeoutMs: 30000,
      });

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Created branch: ${branchName}`,
      });

      return { sandboxId: sbx.sandboxId, branchName };
    });

    const agentResult = await step.run("run-claude-agent", async () => {
      const sbx = await Sandbox.connect(sandboxData.sandboxId, {
        apiKey: serverEnv.E2B_API_KEY,
      });

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "AI agent analyzing codebase...",
      });

      const prompt = `Task: ${task.title}

Description: ${task.description || "No description provided"}

Instructions:
1. Read and understand the codebase structure
2. Implement the requested changes
3. Follow existing code patterns and conventions
4. Make minimal, focused changes`;

      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const result = await sbx.commands.run(
        `cd /workspace && echo '${escapedPrompt}' | claude -p --dangerously-skip-permissions`,
        { timeoutMs: 0 }
      );

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: result.stdout?.slice(0, 500) || "Agent completed",
      });

      return { stdout: result.stdout, branchName: sandboxData.branchName };
    });

    await step.run("commit-and-push", async () => {
      const sbx = await Sandbox.connect(sandboxData.sandboxId, {
        apiKey: serverEnv.E2B_API_KEY,
      });

      const status = await sbx.commands.run(
        `cd /workspace && git status --porcelain`
      );
      if (!status.stdout?.trim()) {
        throw new Error("No changes made by agent");
      }

      await sbx.commands.run(
        `cd /workspace && git add -A && git commit -m "feat: ${task.title.replace(/"/g, '\\"')}" && git push -u origin ${agentResult.branchName}`,
        { timeoutMs: 60000 }
      );

      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: "Changes committed and pushed",
      });
    });

    const prUrl = await step.run("create-pull-request", async () => {
      const freshToken = await getGitHubToken(installationId);

      const prResponse = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            title: task.title,
            body: `## Task\n${task.description || "No description"}\n\n---\n*Implemented by Conductor AI Agent*`,
            head: agentResult.branchName,
            base: "main",
          }),
        }
      );

      const prData = await prResponse.json();
      return prData.html_url || "";
    });

    await step.run("complete-run", async () => {
      await convex.mutation(api.agentRuns.appendLogNoAuth, {
        id: runId as Id<"agentRuns">,
        level: "info",
        message: `Pull request created: ${prUrl}`,
      });

      await convex.mutation(api.agentRuns.completeNoAuth, {
        id: runId as Id<"agentRuns">,
        success: true,
        prUrl,
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

    return { success: true, prUrl };
  }
);
