import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox } from "../sandbox";

export const cleanupSession = inngest.createFunction(
  {
    id: "cleanup-session",
    retries: 1,
  },
  { event: "session/cleanup.requested" },
  async ({ event, step }) => {
    const { clerkToken, sandboxId, sessionId } = event.data;
    const convex = createConvex(clerkToken);

    await step.run("kill-sandbox", async () => {
      if (!sandboxId) {
        return { success: true, message: "No sandbox to cleanup" };
      }

      try {
        const sandbox = await getSandbox(sandboxId);
        await sandbox.delete();
        return { success: true, message: "Sandbox killed successfully" };
      } catch {
        return { success: true, message: "Sandbox already terminated" };
      }
    });

    if (sessionId) {
      await step.run("clear-sandbox-id", async () => {
        try {
          await convex.mutation(api.sessions.clearSandbox, {
            id: sessionId as Id<"sessions">,
          });
          await convex.mutation(api.sessions.addMessage, {
            id: sessionId as Id<"sessions">,
            role: "assistant",
            content: "Sandbox stopped. Start the sandbox to continue working.",
          });
        } catch {
          // Session may already be deleted
        }
      });
    }

    return { success: true };
  }
);
