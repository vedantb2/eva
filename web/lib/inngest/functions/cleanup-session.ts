import { inngest } from "../client";
import { Sandbox } from "e2b";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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
        const sbx = await Sandbox.connect(sandboxId, {
          apiKey: serverEnv.E2B_API_KEY,
        });
        await sbx.kill();
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
        } catch {
          // Session may already be deleted
        }
      });
    }

    return { success: true };
  }
);
