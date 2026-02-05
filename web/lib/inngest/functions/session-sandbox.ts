import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { createSandbox, getSandbox, WORKSPACE_DIR, getGitHubToken, updateRemoteUrl } from "../sandbox";

export const startSandbox = inngest.createFunction(
  { id: "start-sandbox", retries: 2 },
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

      if (session.sandboxId) {
        try {
          const existing = await getSandbox(session.sandboxId);
          await existing.process.executeCommand("echo 1", "/", undefined, 5);
          return {
            sandboxId: session.sandboxId,
            branchName: session.branchName || `session/${sessionId}`,
            isNew: false,
          };
        } catch {
          // sandbox dead or unresponsive, create new
        }
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

      await sandbox.process.executeCommand(
        `cd ${WORKSPACE_DIR} && DISABLE_AUTH=true pnpm dev > /dev/null 2>&1 &`,
        "/",
        undefined,
        10
      );

      await convex.mutation(api.sessions.updateStatus, {
        id: sessionId as Id<"sessions">,
        status: "active",
      });

      return { sandboxId: sandbox.id, branchName, isNew: true };
    });

    await step.run("add-startup-message", async () => {
      const content = sandboxData.isNew
        ? `Sandbox started from snapshot! Ready on branch \`${sandboxData.branchName}\`. Dev server is starting automatically.`
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

export const stopSandbox = inngest.createFunction(
  { id: "stop-sandbox", retries: 1 },
  { event: "session/sandbox.stop" },
  async ({ event, step }) => {
    const { clerkToken, sessionId } = event.data;
    const convex = createConvex(clerkToken);

    const sandboxId = await step.run("fetch-session", async () => {
      const session = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      if (!session) throw new Error("Session not found");
      return session.sandboxId;
    });

    if (sandboxId) {
      await step.run("delete-sandbox", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          await sandbox.delete();
        } catch {
          // sandbox already terminated
        }
      });
    }

    await step.run("clear-and-notify", async () => {
      await convex.mutation(api.sessions.clearSandbox, {
        id: sessionId as Id<"sessions">,
      });
      await convex.mutation(api.sessions.addMessage, {
        id: sessionId as Id<"sessions">,
        role: "assistant",
        content: "Sandbox stopped. Start the sandbox to continue working.",
      });
    });
  }
);
