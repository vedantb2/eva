import { Sandbox } from "e2b";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { serverEnv } from "@/env/server";
import { clientEnv } from "@/env/client";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { runId, taskId, repoId, githubToken } = await request.json();

  const task = await convex.query(api.agentTasks.get, { id: taskId });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const repo = await convex.query(api.githubRepos.get, { id: repoId });
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const sbx = await Sandbox.create("anthropic-claude-code", {
    apiKey: serverEnv.E2B_API_KEY,
    envs: {
      CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
    },
  });

  try {
    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "info",
      message: "Starting agent execution...",
    });

    const repoUrl = `https://x-access-token:${githubToken}@github.com/${repo.owner}/${repo.name}.git`;
    await sbx.commands.run(`git clone ${repoUrl} /workspace`);

    const branchName =
      task.branchName || `conductor/task-${task.taskNumber || Date.now()}`;
    await sbx.commands.run(`cd /workspace && git checkout -b ${branchName}`);

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "info",
      message: `Created branch: ${branchName}`,
    });

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
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

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "info",
      message: result.stdout?.slice(0, 500) || "Agent completed",
    });

    const status = await sbx.commands.run(
      `cd /workspace && git status --porcelain`
    );
    if (!status.stdout?.trim()) {
      throw new Error("No changes made by agent");
    }

    await sbx.commands.run(
      `cd /workspace && git add -A && git commit -m "feat: ${task.title.replace(
        /"/g,
        '\\"'
      )}" && git push -u origin ${branchName}`
    );

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "info",
      message: "Changes committed and pushed",
    });

    const prResponse = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          title: task.title,
          body: `## Task\n${
            task.description || "No description"
          }\n\n---\n*Implemented by Pulse AI Agent*`,
          head: branchName,
          base: "main",
        }),
      }
    );

    const prData = await prResponse.json();
    const prUrl = prData.html_url || "";

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "info",
      message: `Pull request created: ${prUrl}`,
    });

    await convex.mutation(api.agentRuns.complete, {
      id: runId,
      success: true,
      prUrl,
      resultSummary: "Successfully created PR",
    });

    return NextResponse.json({ success: true, prUrl });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await convex.mutation(api.agentRuns.appendLog, {
      id: runId,
      level: "error",
      message: errorMessage,
    });

    await convex.mutation(api.agentRuns.complete, {
      id: runId,
      success: false,
      error: errorMessage,
    });

    return NextResponse.json({ success: false, error: errorMessage });
  } finally {
    await sbx.kill();
  }
}
