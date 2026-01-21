import { inngest } from "../client";
import { Daytona } from "@daytonaio/sdk";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

export const cleanupSession = inngest.createFunction(
  {
    id: "cleanup-session",
    retries: 1,
  },
  { event: "session/cleanup.requested" },
  async ({ event, step }) => {
    const { sandboxId, sessionId } = event.data;

    await step.run("kill-sandbox", async () => {
      if (!sandboxId) {
        return { success: true, message: "No sandbox to cleanup" };
      }

      try {
        const sandbox = await daytona.get(sandboxId);
        await sandbox.delete();
        return { success: true, message: "Sandbox killed successfully" };
      } catch {
        return { success: true, message: "Sandbox already terminated" };
      }
    });

    if (sessionId) {
      await step.run("clear-sandbox-id", async () => {
        try {
          await convex.mutation(api.sessions.clearSandboxNoAuth, {
            id: sessionId as Id<"sessions">,
          });
          await convex.mutation(api.sessions.addMessageNoAuth, {
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
