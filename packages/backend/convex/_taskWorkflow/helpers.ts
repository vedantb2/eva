import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { LlmJson } from "@solvers-hub/llm-json";

export const llmJson = new LlmJson({ attemptCorrection: true });

export function getTaskRunStreamingEntityId(runId: Id<"agentRuns">): string {
  return `task-run-${String(runId)}`;
}

export function getTaskAuditStreamingEntityId(runId: Id<"agentRuns">): string {
  return `task-audit-run-${String(runId)}`;
}

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
    await ctx.db.patch(existing._id, { currentActivity, lastUpdatedAt: now });
  } else {
    await ctx.db.insert("streamingActivity", {
      entityId,
      currentActivity,
      lastUpdatedAt: now,
    });
  }
}

export async function upsertActivityLog(
  ctx: MutationCtx,
  runId: Id<"agentRuns">,
  activityLog: string,
): Promise<void> {
  const existing = await ctx.db
    .query("agentRunActivityLogs")
    .withIndex("by_run", (q) => q.eq("runId", runId))
    .first();
  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { activityLog, updatedAt: now });
  } else {
    await ctx.db.insert("agentRunActivityLogs", {
      runId,
      activityLog,
      updatedAt: now,
    });
  }
}

export function buildRunResultSummary(
  success: boolean,
  prUrl: string | null,
  projectId: Id<"projects"> | undefined,
): string | undefined {
  if (!success) return undefined;
  if (prUrl) return "Created project PR";
  return projectId
    ? "Pushed commit to project branch"
    : "Pushed commit to branch";
}

export async function finalizeRunStatus(
  ctx: MutationCtx,
  params: {
    runId: Id<"agentRuns">;
    projectId: Id<"projects"> | undefined;
    success: boolean;
    error: string | null;
    prUrl: string | null;
    exitReason?: string;
  },
): Promise<void> {
  const run = await ctx.db.get(params.runId);
  if (!run || (run.status !== "queued" && run.status !== "running")) return;

  await ctx.db.patch(params.runId, {
    status: params.success ? "success" : "error",
    finishedAt: Date.now(),
    resultSummary: buildRunResultSummary(
      params.success,
      params.prUrl,
      params.projectId,
    ),
    prUrl: params.prUrl ?? undefined,
    error: params.success ? undefined : (params.error ?? "Unknown error"),
    exitReason: params.exitReason ?? (params.success ? "completed" : "error"),
  });
}

export function extractJsonBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}
