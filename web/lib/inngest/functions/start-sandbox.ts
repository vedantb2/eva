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

export const startSandbox = inngest.createFunction(
  {
    id: "start-sandbox",
    retries: 2,
  },
  { event: "session/sandbox.start" },
  async ({ event, step }) => {
    const { sessionId, repoId, installationId } = event.data;

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

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(installationId);

      // Check if sandbox already exists and is alive
      if (session.sandboxId) {
        try {
          const sbx = await Sandbox.connect(session.sandboxId, {
            apiKey: serverEnv.E2B_API_KEY,
          });
          await sbx.commands.run("echo 'sandbox alive'", { timeoutMs: 5000 });
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || `session/${sessionId}`,
            isNew: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      // Create new sandbox
      const sbx = await Sandbox.create("anthropic-claude-code", {
        apiKey: serverEnv.E2B_API_KEY,
        envs: {
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
          GITHUB_TOKEN: freshToken,
        },
        timeoutMs: 60 * 60 * 1000,
      });

      const repoUrl = `https://x-access-token:${freshToken}@github.com/${repo.owner}/${repo.name}.git`;
      await sbx.commands.run(`git clone ${repoUrl} ~/workspace`, {
        timeoutMs: 120000,
      });

      const branchName = session.branchName || `session/${sessionId}`;

      const branchCheckResult = await sbx.commands.run(
        `cd ~/workspace && git ls-remote --heads origin ${branchName}`,
        { timeoutMs: 30000 }
      );

      if (branchCheckResult.stdout?.includes(branchName)) {
        await sbx.commands.run(
          `cd ~/workspace && git fetch origin ${branchName} && git checkout ${branchName}`,
          { timeoutMs: 30000 }
        );
      } else {
        await sbx.commands.run(
          `cd ~/workspace && git checkout -b ${branchName}`,
          { timeoutMs: 30000 }
        );
      }

      await sbx.commands.run(
        'git config --global user.name "Pulse Agent" && git config --global user.email "agent@pulse.dev"',
        { timeoutMs: 10000 }
      );

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sbx.sandboxId,
        branchName,
      });

      await convex.mutation(api.sessions.updateStatusNoAuth, {
        id: sessionId as Id<"sessions">,
        status: "active",
      });

      return { sandboxId: sbx.sandboxId, branchName, isNew: true };
    });

    await step.run("add-startup-message", async () => {
      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: sandboxData.isNew
          ? `Sandbox started successfully! Ready to execute tasks on branch \`${sandboxData.branchName}\`.`
          : `Sandbox reconnected! Continuing work on branch \`${sandboxData.branchName}\`.`,
      });
    });

    return { success: true, sandboxId: sandboxData.sandboxId };
  }
);
