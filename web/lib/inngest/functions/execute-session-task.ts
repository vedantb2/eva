import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox, WORKSPACE_DIR } from "../sandbox";
import {
  getGitHubToken,
  setupBranch,
  ensureSandbox,
  updateRemoteUrl,
  runClaudeCLI,
  captureGitDiff,
} from "../sandbox-helpers";

export const executeSessionTask = inngest.createFunction(
  {
    id: "execute-session-task",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; sessionId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId,
        role: "assistant",
        content: `Error executing task: ${error.message}`,
      });
    },
  },
  { event: "session/task.execute" },
  async ({ event, step }) => {
    const { clerkToken, sessionId, messageContent, repoId, installationId } =
      event.data;
    const convex = createConvex(clerkToken);

    const { session, repo } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!sessionData || !repoData) {
        throw new Error("Session or repo not found");
      }
      return { session: sessionData, repo: repoData };
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Processing your request...",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(installationId);
      const branchName = session.branchName || `session/${sessionId}`;
      const sandbox = await ensureSandbox(
        session.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.sessions.updateSandbox, {
            id: sessionId as Id<"sessions">,
            sandboxId,
            branchName,
          });
        },
      );
      await setupBranch(sandbox, branchName);
      return { sandboxId: sandbox.id, branchName };
    });

    const result = await step.run("execute-task", async () => {
      const freshToken = await getGitHubToken(installationId);
      const sandbox = await getSandbox(sandboxData.sandboxId);

      await updateRemoteUrl(sandbox, freshToken, repo.owner, repo.name);

      const headResult = await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git rev-parse HEAD`,
        "/",
        undefined,
        10,
      );
      const beforeHead = (headResult.result || "").trim();

      const commitMessage = messageContent.slice(0, 50).replace(/"/g, '\\"');
      const prompt = `You are working on an ongoing session. The user has requested the following task:

## User Request:
${messageContent}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${sandboxData.branchName}

## Instructions:
1. Read the CLAUDE.md file if it exists to understand the codebase
2. Use Glob and Read tools to explore and find relevant files
3. Make the requested changes using Edit or Write tools
4. Commit your changes with: git add -A && git commit -m "task: ${commitMessage}"
5. Push the changes: git push -u origin ${sandboxData.branchName}
6. Respond with a summary of what you did

## Rules:
- Do NOT create PRs - just commit and push
- Do NOT run build, lint, test, or dev commands
- Make minimal, focused changes
- Use the repository's lockfile to determine the correct package manager
- The GITHUB_TOKEN environment variable is set for git operations`;

      const claudeResult = await runClaudeCLI(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      });

      return {
        summary: claudeResult.result || "Task completed successfully.",
        beforeHead,
        sandboxId: sandboxData.sandboxId,
      };
    });

    await step.run("save-diffs", async () => {
      if (!result.beforeHead) return;
      const sandbox = await getSandbox(result.sandboxId);
      const diffs = await captureGitDiff(sandbox, result.beforeHead);
      if (diffs.length > 0) {
        await convex.mutation(api.sessions.updateFileDiffs, {
          id: sessionId as Id<"sessions">,
          fileDiffs: diffs,
        });
      }
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.summary,
      });
    });

    return { success: true };
  },
);
