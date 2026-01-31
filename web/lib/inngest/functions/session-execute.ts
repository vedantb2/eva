import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";

const PR_PATTERN = /create\s*(a\s*)?pr|open\s*pr|make\s*pr/i;

export const sessionExecute = inngest.createFunction(
  { id: "session-execute", retries: 1 },
  { event: "session/execute" },
  async ({ event, step }) => {
    const { clerkToken, sessionId, message, mode = "execute", generatePlan = false } = event.data;
    const convex = createConvex(clerkToken);

    const { repoId, installationId } = await step.run("fetch-session-data", async () => {
      const session = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      if (!session) throw new Error("Session not found");

      const repo = await convex.query(api.githubRepos.get, { id: session.repoId });
      if (!repo) throw new Error("Repository not found");

      return { repoId: session.repoId, installationId: repo.installationId };
    });

    const isPrCommand = mode === "execute" && PR_PATTERN.test(message);

    const eventName = isPrCommand
      ? "session/pr.create"
      : mode === "ask"
        ? "session/ask.execute"
        : mode === "plan"
          ? "session/plan.execute"
          : "session/task.execute";

    await step.sendEvent("dispatch", {
      name: eventName,
      data: {
        clerkToken,
        sessionId,
        messageContent: message,
        repoId,
        installationId,
        generatePlan,
      },
    });
  }
);
