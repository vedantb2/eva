import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { LlmJson } from "@solvers-hub/llm-json";

export const llmJson = new LlmJson({ attemptCorrection: true });

/** Returns the streaming entity ID used for a task run's activity stream. */
export function getTaskRunStreamingEntityId(runId: Id<"agentRuns">): string {
  return `task-run-${String(runId)}`;
}

/** Returns the streaming entity ID used for a task audit's activity stream. */
export function getTaskAuditStreamingEntityId(runId: Id<"agentRuns">): string {
  return `task-audit-run-${String(runId)}`;
}

/** Deletes the streaming activity record for a given entity ID. */
export async function clearStreamingActivity(
  ctx: MutationCtx,
  entityId: string,
): Promise<void> {
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (streaming) await ctx.db.delete(streaming._id);
}

/** Creates or updates the streaming activity record for a given entity. */
export async function upsertStreamingActivity(
  ctx: MutationCtx,
  entityId: string,
  currentActivity: string,
): Promise<void> {
  const existing = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  const now = Date.now();
  if (existing) {
    if (existing.currentActivity !== currentActivity) {
      await ctx.db.patch(existing._id, { currentActivity, lastUpdatedAt: now });
    } else {
      await ctx.db.patch(existing._id, { lastUpdatedAt: now });
    }
  } else {
    await ctx.db.insert("streamingActivity", {
      entityId,
      currentActivity,
      lastUpdatedAt: now,
    });
  }
}

/** Creates or updates a persistent activity log entry for a run. */
export async function upsertActivityLog(
  ctx: MutationCtx,
  runId: Id<"agentRuns">,
  activityLog: string,
  type: "run" | "audit" | "fix" = "run",
): Promise<void> {
  const existing = await ctx.db
    .query("agentRunActivityLogs")
    .withIndex("by_run_and_type", (q) => q.eq("runId", runId).eq("type", type))
    .first();
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { activityLog, updatedAt: now });
  } else {
    await ctx.db.insert("agentRunActivityLogs", {
      runId,
      activityLog,
      type,
      updatedAt: now,
    });
  }
}

/** Copies current streaming activity into a persistent activity log before cleanup. */
export async function snapshotStreamingActivityToLog(
  ctx: MutationCtx,
  entityId: string,
  runId: Id<"agentRuns">,
): Promise<void> {
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (streaming?.currentActivity) {
    await upsertActivityLog(ctx, runId, streaming.currentActivity);
  }
}

/** Builds a human-readable summary string for a completed run result. */
export function buildRunResultSummary(
  success: boolean,
  prUrl: string | null,
  projectId: Id<"projects"> | undefined,
  claudeResult?: string,
): string | undefined {
  if (!success) return undefined;
  if (claudeResult) return claudeResult;
  if (prUrl) return projectId ? "Created project PR" : "Created task PR";
  return projectId
    ? "Pushed commit to project branch"
    : "Pushed commit to task branch";
}

/** Patches the run document with final status, error, PR URL, and result summary. */
export async function finalizeRunStatus(
  ctx: MutationCtx,
  params: {
    runId: Id<"agentRuns">;
    projectId: Id<"projects"> | undefined;
    success: boolean;
    error: string | null;
    prUrl: string | null;
    exitReason?: string;
    claudeResult?: string;
    errorType?: "rate_limit" | "generic";
  },
): Promise<void> {
  const run = await ctx.db.get(params.runId);
  if (!run || (run.status !== "queued" && run.status !== "running")) return;

  await ctx.db.patch(params.runId, {
    status: params.success ? "success" : "error",
    finalizingAt: undefined,
    finishedAt: Date.now(),
    resultSummary: buildRunResultSummary(
      params.success,
      params.prUrl,
      params.projectId,
      params.claudeResult,
    ),
    prUrl: params.prUrl ?? undefined,
    error: params.success ? undefined : (params.error ?? "Unknown error"),
    exitReason: params.exitReason ?? (params.success ? "completed" : "error"),
    errorType: params.success ? undefined : params.errorType,
  });
}

/** Extracts a JSON block from text, handling code fences and raw JSON objects. */
export function extractJsonBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}
