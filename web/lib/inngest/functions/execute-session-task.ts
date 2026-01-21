import { inngest } from "../client";
import { Daytona } from "@daytonaio/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

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

export const executeSessionTask = inngest.createFunction(
  {
    id: "execute-session-task",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { sessionId: string } };
      };
      const sessionId = eventData.event.data.sessionId as Id<"sessions">;
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId,
        role: "assistant",
        content: `Error executing task: ${error.message}`,
      });
    },
  },
  { event: "session/task.execute" },
  async ({ event, step }) => {
    const { sessionId, messageContent, repoId, installationId } = event.data;

    const { session, repo } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.getNoAuth, {
        id: sessionId as Id<"sessions">,
      });
      const repoData = await convex.query(api.githubRepos.getNoAuth, {
        id: repoId as Id<"githubRepos">,
      });
      if (!sessionData || !repoData) {
        throw new Error("Session or repo not found");
      }
      return { session: sessionData, repo: repoData };
    });

    await step.run("add-processing-message", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Processing your request...",
      });
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(installationId);

      if (session.sandboxId) {
        try {
          const sandbox = await daytona.get(session.sandboxId);
          await sandbox.process.executeCommand("echo 'sandbox alive'", "/", undefined, 5);
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || `session/${sessionId}`,
            isNew: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      const sandbox = await daytona.create({
        envVars: {
          GITHUB_TOKEN: freshToken,
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
        },
        autoStopInterval: 60,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sandbox.process.executeCommand(
        `git clone ${repoUrl} ~/workspace`,
        "/",
        undefined,
        120
      );

      const branchName = session.branchName || `session/${sessionId}`;

      const branchCheckResult = await sandbox.process.executeCommand(
        `cd ~/workspace && git ls-remote --heads origin ${branchName}`,
        "/",
        undefined,
        30
      );

      if (branchCheckResult.result?.includes(branchName)) {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git fetch origin ${branchName} && git checkout ${branchName}`,
          "/",
          undefined,
          30
        );
      } else {
        await sandbox.process.executeCommand(
          `cd ~/workspace && git checkout -b ${branchName}`,
          "/",
          undefined,
          30
        );
      }

      await sandbox.process.executeCommand(
        'git config --global user.name "Pulse Agent" && git config --global user.email "agent@pulse.dev"',
        "/",
        undefined,
        10
      );

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
        branchName,
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
    });

    const result = await step.run("execute-task", async () => {
      const freshToken = await getGitHubToken(installationId);

      const sandbox = await daytona.get(sandboxData.sandboxId);

      await sandbox.process.executeCommand(
        `cd ~/workspace && git remote set-url origin https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`,
        "/",
        undefined,
        10
      );

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

      const escapedPrompt = prompt.replace(/'/g, "'\\''");

      let output = "";
      try {
        const cmdResult = await sandbox.process.executeCommand(
          `cd ~/workspace && echo '${escapedPrompt}' | npx -y @anthropic-ai/claude-code@latest -p --dangerously-skip-permissions --model opus --allowedTools "Read,Write,Edit,Bash,Glob,Grep" --output-format json`,
          "/",
          undefined,
          0
        );
        output = cmdResult.result || "";
      } catch (err) {
        const error = err as {
          result?: string;
          message?: string;
        };
        throw new Error(
          `Claude agent failed: ${
            error.result || error.message || "Unknown error"
          }`
        );
      }

      let summary = "Task completed successfully.";
      try {
        const jsonResponse = JSON.parse(output);
        if (jsonResponse.result) {
          summary = jsonResponse.result;
        }
      } catch {
        if (output.length > 0) {
          summary = output.slice(-2000);
        }
      }

      return { summary };
    });

    await step.run("update-session", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: result.summary,
      });
    });

    return { success: true };
  }
);
