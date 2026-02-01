import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";

export const buildProject = inngest.createFunction(
  { id: "build-project", retries: 0 },
  { event: "project/build.requested" },
  async ({ event, step }) => {
    const { clerkToken, projectId } = event.data;
    const convex = createConvex(clerkToken);

    const tasks = await step.run("fetch-tasks", async () => {
      const allTasks = await convex.query(api.agentTasks.listByProject, {
        projectId: projectId as Id<"projects">,
      });
      return allTasks
        .filter((t) => t.status === "todo")
        .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0));
    });

    const results: Array<{ taskId: string; success: boolean }> = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      const executionData = await step.run(`start-task-${i}`, async () => {
        return await convex.mutation(api.agentTasks.startExecution, {
          id: task._id as Id<"agentTasks">,
        });
      });

      await step.sendEvent(`trigger-task-${i}`, {
        name: "task/execute.requested",
        data: {
          clerkToken,
          runId: executionData.runId,
          taskId: executionData.taskId,
          repoId: executionData.repoId,
          installationId: executionData.installationId,
          projectId: executionData.projectId,
          branchName: executionData.branchName,
          isFirstTaskOnBranch: executionData.isFirstTaskOnBranch,
        },
      });

      const completionEvent = await step.waitForEvent(`wait-task-${i}`, {
        event: "task/execute.completed",
        match: "data.taskId",
        timeout: "15m",
      });

      const success = completionEvent?.data.success === true;
      results.push({ taskId: task._id, success });

      if (!success) break;
    }

    return { results };
  },
);
