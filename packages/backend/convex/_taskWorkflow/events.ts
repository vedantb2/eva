import { v } from "convex/values";
import { defineEvent } from "@convex-dev/workflow";
import { workflowCompleteValidator } from "../validators";

/** Workflow event emitted when the main task execution completes. */
export const taskCompleteEvent = defineEvent({
  name: "taskComplete",
  validator: workflowCompleteValidator,
});

/** Workflow event emitted when a build-phase task finishes within a project. */
export const buildTaskDoneEvent = defineEvent({
  name: "buildTaskDone",
  validator: v.object({
    taskId: v.id("agentTasks"),
    success: v.boolean(),
  }),
});

