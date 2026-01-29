import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { getSandbox } from "../sandbox";

export const cleanupProjectSandbox = inngest.createFunction(
  {
    id: "cleanup-project-sandbox",
    retries: 2,
  },
  { event: "project/sandbox.cleanup" },
  async ({ event, step }) => {
    const { clerkToken, projectId, sandboxId } = event.data;
    const convex = createConvex(clerkToken);

    await step.run("delete-sandbox", async () => {
      try {
        const sandbox = await getSandbox(sandboxId);
        await sandbox.delete();
      } catch {
        // Sandbox may already be deleted or not found
      }
    });

    await step.run("clear-sandbox-from-project", async () => {
      await convex.mutation(api.projects.clearProjectSandbox, {
        id: projectId as Id<"projects">,
      });
    });

    return { success: true };
  }
);
