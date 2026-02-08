import { v } from "convex/values";

export const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("business_review"),
  v.literal("code_review"),
  v.literal("done"),
);

export const runStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("success"),
  v.literal("error"),
);

export const logLevelValidator = v.union(
  v.literal("info"),
  v.literal("warn"),
  v.literal("error"),
);

export const roleValidator = v.union(v.literal("user"), v.literal("assistant"));

export const sessionModeValidator = v.union(
  v.literal("execute"),
  v.literal("ask"),
  v.literal("plan"),
  v.literal("flag"),
);

export const sessionStatusValidator = v.union(
  v.literal("active"),
  v.literal("closed"),
);

export const phaseValidator = v.union(
  v.literal("draft"),
  v.literal("finalized"),
  v.literal("active"),
  v.literal("completed"),
);

export const indexingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("indexing"),
  v.literal("complete"),
  v.literal("error"),
);

export const evaluationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("error"),
);

export const themeValidator = v.union(v.literal("light"), v.literal("dark"));

export const evalResultValidator = v.object({
  requirement: v.string(),
  passed: v.boolean(),
  detail: v.string(),
});

export const userFlowValidator = v.object({
  name: v.string(),
  steps: v.array(v.string()),
});

export const notificationTypeValidator = v.union(
  v.literal("routine_complete"),
  v.literal("export_ready"),
  v.literal("task_complete"),
  v.literal("task_assigned"),
  v.literal("comment_added"),
  v.literal("run_completed"),
  v.literal("system"),
);

export const roleUserValidator = v.union(
  v.literal("business"),
  v.literal("dev"),
);
