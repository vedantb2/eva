import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { createSandbox, isSandboxAlive, WORKSPACE_DIR, getGitHubToken, updateRemoteUrl } from "../sandbox";

export const startSandbox = inngest.createFunction(
  {
    id: "start-sandbox",
    retries: 2,
  },
  { event: "session/sandbox.start" },
  async ({ event, step }) => {
    const { clerkToken, sessionId } = event.data;
    const convex = createConvex(clerkToken);

    const { session, repo } = await step.run("fetch-session-data", async () => {
      const sessionData = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      if (!sessionData) throw new Error("Session not found");
      const repoData = await convex.query(api.githubRepos.get, {
        id: sessionData.repoId,
      });
      if (!repoData) throw new Error("Repository not found");
      return { session: sessionData, repo: repoData };
    });

    const sandboxData = await step.run("setup-sandbox", async () => {
      const freshToken = await getGitHubToken(repo.installationId);

      if (session.sandboxId && await isSandboxAlive(session.sandboxId)) {
        return {
          sandboxId: session.sandboxId,
          branchName: session.branchName || `session/${sessionId}`,
          isNew: false,
        };
      }

      const branchName = session.branchName || "main";
      const sandbox = await createSandbox(freshToken);
      await updateRemoteUrl(sandbox, freshToken, repo.owner, repo.name);
      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && git fetch origin && git reset --hard origin/${branchName} && pnpm install`,
        "/",
        undefined,
        120
      );

      await convex.mutation(api.sessions.updateSandbox, {
        id: sessionId as Id<"sessions">,
        sandboxId: sandbox.id,
        branchName,
      });

      await convex.mutation(api.sessions.updateStatus, {
        id: sessionId as Id<"sessions">,
        status: "active",
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
    });

    await step.run("add-startup-message", async () => {
      const content = sandboxData.isNew
        ? `Sandbox started from snapshot! Ready on branch \`${sandboxData.branchName}\`. Run \`pnpm dev\` in the terminal to start the dev server.`
        : `Sandbox reconnected! Continuing work on branch \`${sandboxData.branchName}\`.`;

      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content,
      });
    });

    return { success: true, sandboxId: sandboxData.sandboxId };
  }
);
