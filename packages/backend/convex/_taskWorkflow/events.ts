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

/** Workflow event emitted when the post-run audit step completes. */
export const auditCompleteEvent = defineEvent({
  name: "auditComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

/** Workflow event emitted when an audit fix attempt completes. */
export const auditFixCompleteEvent = defineEvent({
  name: "auditFixComplete",
  validator: workflowCompleteValidator,
});
