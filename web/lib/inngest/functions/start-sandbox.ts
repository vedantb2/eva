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
          CLAUDE_CODE_OAUTH_TOKEN: serverEnv.CLAUDE_CODE_OAUTH_TOKEN,
          GITHUB_TOKEN: freshToken,
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

      await convex.mutation(api.sessions.updateStatusNoAuth, {
        id: sessionId as Id<"sessions">,
        status: "active",
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
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
