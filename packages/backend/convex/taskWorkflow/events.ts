import { v } from "convex/values";
import { defineEvent } from "@convex-dev/workflow";

export const taskCompleteEvent = defineEvent({
  name: "taskComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

export const buildTaskDoneEvent = defineEvent({
  name: "buildTaskDone",
  validator: v.object({
    taskId: v.id("agentTasks"),
    success: v.boolean(),
  }),
});

export const auditCompleteEvent = defineEvent({
  name: "auditComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  }),
});
