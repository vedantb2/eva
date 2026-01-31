import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox } from "../sandbox";

export const stopSandbox = inngest.createFunction(
  { id: "stop-sandbox", retries: 1 },
  { event: "session/sandbox.stop" },
  async ({ event, step }) => {
    const { clerkToken, sessionId } = event.data;
    const convex = createConvex(clerkToken);

    const sandboxId = await step.run("close-session", async () => {
      const session = await convex.query(api.sessions.get, {
        id: sessionId as Id<"sessions">,
      });
      if (!session) throw new Error("Session not found");

      await convex.mutation(api.sessions.updateStatus, {
        id: sessionId as Id<"sessions">,
        status: "closed",
      });

      return session.sandboxId;
    });

    if (sandboxId) {
      await step.run("cleanup-sandbox", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          await sandbox.delete();
        } catch {
          // sandbox already terminated
        }
      });
    }
  }
);
