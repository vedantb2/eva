import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { getSandbox } from "../sandbox";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export const cleanupProjectSandbox = inngest.createFunction(
  {
    id: "cleanup-project-sandbox",
    retries: 2,
  },
  { event: "project/sandbox.cleanup" },
  async ({ event, step }) => {
    const { projectId, sandboxId } = event.data;

    await step.run("delete-sandbox", async () => {
      try {
        const sandbox = await getSandbox(sandboxId);
        await sandbox.delete();
      } catch {
        // Sandbox may already be deleted or not found
      }
    });

    await step.run("clear-sandbox-from-project", async () => {
      await convex.mutation(api.projects.clearSandboxNoAuth, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true };
  }
);
