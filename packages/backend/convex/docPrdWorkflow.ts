import { v } from "convex/values";
import { z } from "zod";
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
import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";

const prdCompleteEvent = defineEvent({
  name: "prdComplete",
  validator: workflowCompleteValidator,
});

/** Trimmed, non-empty strings; non-strings and blanks are dropped rather than rejected. */
const trimmedStringList = z
  .array(z.string().catch(""))
  .catch([])
  .transform((items) => items.map((s) => s.trim()).filter((s) => s.length > 0));

/**
 * Parses parsed doc fields (description, requirements, user flows) from LLM output.
 * Missing or invalid values fall back to their defaults instead of rejecting the whole payload.
 */
const parsedDocFieldsSchema = z
  .object({
    description: z
      .string()
      .catch("")
      .transform((s) => s.trim())
      .transform((s) => (s.length > 0 ? s : undefined)),
    requirements: trimmedStringList,
    userFlows: z
      .array(
        z
          .object({ name: z.string().catch(""), steps: trimmedStringList })
          .catch({ name: "", steps: [] }),
      )
      .catch([])
      .transform((flows) =>
        flows
          .map((flow) => ({ name: flow.name.trim(), steps: flow.steps }))
          .filter((flow) => flow.name.length > 0 && flow.steps.length > 0),
      ),
  })
  .catch({ description: undefined, requirements: [], userFlows: [] });

/** Normalizes and sanitizes parsed doc fields (description, requirements, user flows) from LLM output. */
function normalizeParsedDocFields(
  raw: unknown,
): z.infer<typeof parsedDocFieldsSchema> {
  return parsedDocFieldsSchema.parse(raw);
}

// --- Workflow definition ---

/** Runs the PRD parsing workflow: prepares sandbox, launches the agent, and saves extracted fields. */
export const docPrdWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch doc + repo data, build prompt
    const docData = await step.runQuery(internal.docPrdWorkflow.getDocData, {
      docId: args.docId,
    });

    const { sandboxId, vercelSandboxId } = await prepareSandboxSteps(step, {
      existingSandboxId: docData.sandboxId,
      vercelSandboxId: docData.vercelSandboxId,
      installationId: args.installationId,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      repoId: docData.repoId,
      streamingEntityId: args.docId,
      ephemeral: false,
    });

    await step.runMutation(internal.docInterviewWorkflow.saveDocSandboxId, {
      docId: args.docId,
      sandboxId,
      vercelSandboxId,
    });

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
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
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

## PRD Content
${doc.content}

## Task
Use the PRD content and repository context to produce description, requirements, and user flows.

Output ONLY valid JSON.`;

    return {
      sandboxId: doc.sandboxId,
      vercelSandboxId: doc.vercelSandboxId,
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
        // Preserve manual description edits — only set if currently empty.
        const description = doc.description?.trim()
          ? doc.description
          : normalized.description;
        const now = Date.now();
        await ctx.db.patch(args.docId, {
          description,
          requirements: normalized.requirements,
          userFlows: normalized.userFlows,
          activeWorkflowId: undefined,
          lastParsedAt: now,
          updatedAt: now,
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
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await trackDocWorkflow(ctx, args.docId, workflowId);

    return null;
  },
});
