import { v } from "convex/values";

export const workflowCompleteValidator = v.object({
  success: v.boolean(),
  result: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
  activityLog: v.union(v.string(), v.null()),
});

export const taskStatusValidator = v.union(
  v.literal("draft"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("business_review"),
  v.literal("code_review"),
  v.literal("done"),
  v.literal("cancelled"),
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
  v.literal("starting"),
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

export const auditSectionValidator = v.object({
  name: v.string(),
  results: v.array(evalResultValidator),
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
  v.literal("rate_limit"),
  v.literal("system"),
);

export const errorTypeValidator = v.union(
  v.literal("rate_limit"),
  v.literal("generic"),
);

export const deploymentStatusValidator = v.union(
  v.literal("queued"),
  v.literal("building"),
  v.literal("deployed"),
  v.literal("error"),
);

export const roleUserValidator = v.union(
  v.literal("business"),
  v.literal("dev"),
);

export const claudeModelValidator = v.union(
  v.literal("opus"),
  v.literal("sonnet"),
  v.literal("haiku"),
);

export const CLAUDE_MODELS = ["opus", "sonnet", "haiku"] as const;
export type ClaudeModel = (typeof CLAUDE_MODELS)[number];

export const queryConfirmationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
);

export const snapshotScheduleValidator = v.string();

export const snapshotBuildStatusValidator = v.union(
  v.literal("running"),
  v.literal("success"),
  v.literal("error"),
);

export const snapshotBuildTriggerValidator = v.union(
  v.literal("cron"),
  v.literal("manual"),
);

export const teamMemberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("member"),
);

export const webhookEventStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("skipped"),
);

export const variationValidator = v.object({
  label: v.string(),
  route: v.optional(v.string()),
  filePath: v.optional(v.string()),
});

export const accentColorValidator = v.union(
  v.literal("teal"),
  v.literal("blue"),
  v.literal("purple"),
  v.literal("rose"),
  v.literal("orange"),
  v.literal("green"),
  v.literal("amber"),
  v.literal("cyan"),
  v.literal("pink"),
  v.literal("indigo"),
  v.literal("red"),
);

export const radiusValidator = v.union(
  v.literal("none"),
  v.literal("sm"),
  v.literal("md"),
  v.literal("lg"),
  v.literal("xl"),
);

export const fontFamilyValidator = v.union(
  v.literal("inter"),
  v.literal("roboto"),
  v.literal("poppins"),
  v.literal("dm-sans"),
  v.literal("space-grotesk"),
  v.literal("geist"),
);

export const letterSpacingValidator = v.union(
  v.literal("tighter"),
  v.literal("tight"),
  v.literal("normal"),
  v.literal("wide"),
  v.literal("wider"),
);

export const customThemeValidator = v.object({
  accentColor: v.optional(accentColorValidator),
  radius: v.optional(radiusValidator),
  fontFamily: v.optional(fontFamilyValidator),
  letterSpacing: v.optional(letterSpacingValidator),
});
