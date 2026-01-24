import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { createSandboxFromSnapshot, getSandbox } from "../sandbox";
import { getGitHubToken, cloneRepo, setupBranch, configureGit, updateRemoteUrl } from "../sandbox-helpers";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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
          const existingSandbox = await getSandbox(session.sandboxId);
          await existingSandbox.process.executeCommand("echo 'sandbox alive'", "/", undefined, 5);
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || `session/${sessionId}`,
            isNew: false,
            usedSnapshot: false,
          };
        } catch {
          // Sandbox expired or dead, create new one
        }
      }

      const branchName = session.branchName || "main";

      const { sandbox, usedSnapshot } = await createSandboxFromSnapshot(
        freshToken,
        repo.owner,
        repo.name,
        branchName
      );

      if (usedSnapshot) {
        await configureGit(sandbox);
        await updateRemoteUrl(sandbox, freshToken, repo.owner, repo.name, "/home/daytona/workspace");
        await sandbox.process.executeCommand(
          `cd /home/daytona/workspace && git fetch origin && git reset --hard origin/${branchName}`,
          "/",
          undefined,
          60
        );
      } else {
        await cloneRepo(sandbox, freshToken, repo.owner, repo.name);

        if (branchName !== "main" && branchName !== "master") {
          await setupBranch(sandbox, branchName);
        }

        await configureGit(sandbox);

        await sandbox.process.executeCommand("npm install -g pnpm", "/", undefined, 60);
        await sandbox.process.executeCommand("pnpm install", "/home/daytona/workspace", undefined, 300);
      }

      await convex.mutation(api.sessions.updateSandboxNoAuth, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
        branchName,
      });

      await convex.mutation(api.sessions.updateStatusNoAuth, {
        id: sessionId as Id<"sessions">,
        status: "active",
      });

      return { sandboxId: sandbox.id, branchName, isNew: true, usedSnapshot };
    });

    await step.run("add-startup-message", async () => {
      let content: string;
      if (!sandboxData.isNew) {
        content = `Sandbox reconnected! Continuing work on branch \`${sandboxData.branchName}\`.`;
      } else if (sandboxData.usedSnapshot) {
        content = `Sandbox started from snapshot! Ready on branch \`${sandboxData.branchName}\`. Run \`pnpm dev\` in the terminal to start the dev server.`;
      } else {
        content = `Sandbox started and dependencies installed! Ready on branch \`${sandboxData.branchName}\`. Run \`pnpm dev\` in the terminal to start the dev server.`;
      }

      await convex.mutation(api.sessions.addMessageNoAuth, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content,
      });
    });

    return { success: true, sandboxId: sandboxData.sandboxId };
  }
);
