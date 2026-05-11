import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator } from "./validators";
import { trackDocWorkflow } from "./workflowWatchdog";
import { PARSE_PROMPT } from "./prompts";
import {
  clearStreamingActivity,
  extractFirstJsonValue,
  recordCompletionLog,
  sendCompletionEvent,
} from "./_taskWorkflow/helpers";

const prdCompleteEvent = defineEvent({
  name: "prdComplete",
  validator: workflowCompleteValidator,
});

interface ParsedDocFields {
  description?: string;
  requirements?: string[];
  userFlows?: Array<{ name: string; steps: string[] }>;
}

/** Normalizes and sanitizes parsed doc fields (description, requirements, user flows) from LLM output. */
function normalizeParsedDocFields(raw: unknown): ParsedDocFields {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { description: undefined, requirements: [], userFlows: [] };
  }
  const obj: Record<string, unknown> = Object.fromEntries(Object.entries(raw));

  const description =
    typeof obj.description === "string" && obj.description.trim().length > 0
      ? obj.description.trim()
      : undefined;

  const requirementsRaw: unknown[] = Array.isArray(obj.requirements)
    ? obj.requirements
    : [];
  const requirements: string[] = [];
  for (const item of requirementsRaw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.length > 0) requirements.push(trimmed);
  }

  const userFlowsRaw: unknown[] = Array.isArray(obj.userFlows)
    ? obj.userFlows
    : [];
  const userFlows: Array<{ name: string; steps: string[] }> = [];
  for (const flow of userFlowsRaw) {
    if (typeof flow !== "object" || flow === null || Array.isArray(flow)) {
      continue;
    }
    const f: Record<string, unknown> = Object.fromEntries(Object.entries(flow));
    if (typeof f.name !== "string") continue;
    const name = f.name.trim();
    if (name.length === 0) continue;
    const rawSteps: unknown[] = Array.isArray(f.steps) ? f.steps : [];
    const steps: string[] = [];
    for (const step of rawSteps) {
      if (typeof step !== "string") continue;
      const trimmed = step.trim();
      if (trimmed.length > 0) steps.push(trimmed);
    }
    if (steps.length === 0) continue;
    userFlows.push({ name, steps });
  }

  return { description, requirements, userFlows };
}

// --- Workflow definition ---

/** Runs the PRD parsing workflow: prepares sandbox, launches the agent, and saves extracted fields. */
export const docPrdWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    prdContent: v.string(),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch doc + repo data, build prompt
    const docData = await step.runQuery(internal.docPrdWorkflow.getDocData, {
      docId: args.docId,
      prdContent: args.prdContent,
    });

    const { sandboxId } = await step.runAction(
      internal.daytona.prepareSandbox,
      {
        existingSandboxId: docData.sandboxId,
        installationId: args.installationId,
        repoOwner: docData.repoOwner,
        repoName: docData.repoName,
        repoId: docData.repoId,
        streamingEntityId: args.docId,
      },
    );

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: args.docId,
      prompt: docData.prompt,
      userId: args.userId,
      completionMutation: "docPrdWorkflow:handleCompletion",
      entityIdField: "docId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      repoId: docData.repoId,
    });

    // Step 3: Wait for callback
    const result = await step.awaitEvent(prdCompleteEvent);

    // Step 4: Save results
    await step.runMutation(internal.docPrdWorkflow.saveResult, {
      docId: args.docId,
      success: result.success,
      result: result.result,
      error: result.error,
    });
  },
});

// --- Supporting internal functions ---

/** Fetches document and repo data and builds the PRD parsing prompt. */
export const getDocData = internalQuery({
  args: {
    docId: v.id("docs"),
    prdContent: v.string(),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    const prompt = `${PARSE_PROMPT}

## Document Title
"${doc.title}"

## Uploaded PRD Content
${args.prdContent}

## Task
Use the uploaded PRD content and repository context to produce description, requirements, and user flows.

Output ONLY valid JSON.`;

    return {
      sandboxId: doc.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: doc.repoId,
      prompt,
    };
  },
});

/** Saves the PRD parsing result, normalizing and patching the doc with extracted fields. */
export const saveResult = internalMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.docId));

    const doc = await ctx.db.get(args.docId);
    if (!doc) return null;

    if (args.success && args.result) {
      const parsed = extractFirstJsonValue(args.result);
      if (parsed !== undefined) {
        const normalized = normalizeParsedDocFields(parsed);
        await ctx.db.patch(args.docId, {
          description: normalized.description,
          requirements: normalized.requirements,
          userFlows: normalized.userFlows,
          activeWorkflowId: undefined,
          updatedAt: Date.now(),
        });
        return null;
      }
    }

    // On failure, just clear the workflow
    await ctx.db.patch(args.docId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Called by the sandbox via Convex HTTP API (authenticated with Clerk JWT).
 */
export const handleCompletion = authMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.activeWorkflowId) return null;

    await sendCompletionEvent(ctx, prdCompleteEvent, doc.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
    });

    await recordCompletionLog(ctx, {
      entityType: "doc",
      entityId: String(args.docId),
      entityTitle: doc.title,
      repoId: doc.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    return null;
  },
});

/**
 * Public mutation to start the PRD parsing workflow from the frontend.
 */
export const startPrdParse = authMutation({
  args: {
    docId: v.id("docs"),
    prdContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    const workflowId = await workflow.start(
      ctx,
      internal.docPrdWorkflow.docPrdWorkflow,
      {
        docId: args.docId,
        prdContent: args.prdContent,
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await trackDocWorkflow(ctx, args.docId, workflowId);

    return null;
  },
});
