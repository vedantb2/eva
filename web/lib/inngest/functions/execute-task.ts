import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import {
  getSandbox,
  WORKSPACE_DIR,
  getGitHubToken,
  syncRepo,
  setupBranch,
  getOrCreateSandbox,
  runClaudeCLI,
} from "../sandbox";

export const executeTask = inngest.createFunction(
  {
    id: "execute-task",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; runId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const runId = eventData.event.data.runId as Id<"agentRuns">;
      await convex.mutation(api.agentRuns.complete, {
        id: runId,
        success: false,
        error: error.message,
      });
    },
  },
  { event: "task/execute.requested" },
  async ({ event, step }) => {
    const {
      clerkToken,
      runId,
      taskId,
      repoId,
      installationId,
      projectId,
      branchName,
      isFirstTaskOnBranch,
    } = event.data;
    const convex = createConvex(clerkToken);

    const { task, repo, project, subtasks } = await step.run(
      "fetch-task-data",
      async () => {
        const taskData = await convex.query(api.agentTasks.get, { id: taskId });
        const repoData = await convex.query(api.githubRepos.get, {
          id: repoId,
        });
        if (!taskData || !repoData) throw new Error("Task or repo not found");
        const projectData = projectId
          ? await convex.query(api.projects.get, { id: projectId })
          : null;
        const subtaskData = await convex.query(api.subtasks.listByTask, {
          parentTaskId: taskId,
        });
        return {
          task: taskData,
          repo: repoData,
          project: projectData,
          subtasks: subtaskData,
        };
      },
    );

    await step.run("update-status-running", async () => {
      await convex.mutation(api.agentRuns.updateStatus, {
        id: runId as Id<"agentRuns">,
        status: "running",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(installationId);
      const taskBranchName =
        branchName || `eva/task-${task.taskNumber || Date.now()}`;

      const sandbox = await getOrCreateSandbox(
        project?.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          if (projectId) {
            await convex.mutation(api.projects.updateProjectSandbox, {
              id: projectId as Id<"projects">,
              sandboxId,
            });
          }
        },
      );

      await syncRepo(sandbox, githubToken, repo.owner, repo.name);
      await setupBranch(sandbox, taskBranchName);

      if (projectId) {
        await convex.mutation(api.projects.updateLastSandboxActivity, {
          id: projectId as Id<"projects">,
        });
      }

      return { sandboxId: sandbox.id, branchName: taskBranchName };
    });

    await step.run("run-agent", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      const subtasksList =
        subtasks.length > 0
          ? `\n## Subtasks:\n${subtasks.map((s, i) => `${i}. ${s.title}`).join("\n")}`
          : "";

      const prompt = `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${subtasksList}

## Steps:
1. Read CLAUDE.md to understand the codebase
2. Implement the changes by editing source code files
3. Update CLAUDE.md if you made major changes
4. Run: git add -A && git commit -m "feat(task-${task.taskNumber || 1}): ${task.title}"
5. Run: git push -u origin ${sandboxData.branchName}

## Rules:
- Do NOT create .md plan files
- Do NOT run build, lint, test, or dev commands
- Use the lockfile to determine the package manager
- GITHUB_TOKEN is already set for git push`;

      const result = await runClaudeCLI(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        workDir: WORKSPACE_DIR,
        timeout: 600,
      });

      if (result.isError)
        throw new Error(`Agent failed: ${result.result.slice(0, 500)}`);
    });

    const prUrl = isFirstTaskOnBranch
      ? await step.run("create-pr", async () => {
          const githubToken = await getGitHubToken(installationId);
          const res = await fetch(
            `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
              },
              body: JSON.stringify({
                title: task.title,
                body: `## Task\n${task.description || "No description"}\n\n---\n*Implemented by Eva AI Agent*`,
                head: sandboxData.branchName,
                base: "main",
              }),
            },
          );
          if (!res.ok)
            throw new Error(`Failed to create PR: ${await res.text()}`);
          const pr: { html_url: string } = await res.json();
          return pr.html_url;
        })
      : undefined;

    await step.run("mark-subtasks-completed", async () => {
      if (subtasks.length > 0) {
        await convex.mutation(api.subtasks.markCompleted, {
          parentTaskId: taskId as Id<"agentTasks">,
          completedIndices: subtasks.map((_, i) => i),
        });
      }
    });

    await step.run("complete-run", async () => {
      if (prUrl && projectId) {
        await convex.mutation(api.projects.updatePrUrl, {
          id: projectId as Id<"projects">,
          prUrl,
        });
      }

      if (projectId) {
        await convex.mutation(api.projects.updateLastSandboxActivity, {
          id: projectId as Id<"projects">,
        });
      }

      await convex.mutation(api.agentRuns.complete, {
        id: runId as Id<"agentRuns">,
        success: true,
        resultSummary: prUrl
          ? "Created project PR"
          : "Pushed commit to project branch",
      });
    });

    return { success: true, prUrl };
  },
);
