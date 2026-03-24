import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { PARSE_PROMPT } from "./prompts";
import { clearStreamingActivity, llmJson } from "./_taskWorkflow/helpers";

const prdCompleteEvent = defineEvent({
  name: "prdComplete",
  validator: workflowCompleteValidator,
});

interface ParsedDocFields {
  description?: string;
  requirements?: string[];
  userFlows?: Array<{ name: string; steps: string[] }>;
}

function normalizeParsedDocFields(
  raw: Partial<ParsedDocFields>,
): ParsedDocFields {
  const description =
    typeof raw.description === "string" && raw.description.trim().length > 0
      ? raw.description.trim()
      : undefined;

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const userFlows = Array.isArray(raw.userFlows)
    ? raw.userFlows
        .filter(
          (flow): flow is { name: string; steps: string[] } =>
            typeof flow === "object" &&
            flow !== null &&
            typeof flow.name === "string" &&
            Array.isArray(flow.steps),
        )
        .map((flow) => ({
          name: flow.name.trim(),
          steps: flow.steps
            .filter((step): step is string => typeof step === "string")
            .map((step) => step.trim())
            .filter(Boolean),
        }))
        .filter((flow) => flow.name.length > 0 && flow.steps.length > 0)
    : [];

  return { description, requirements, userFlows };
}

// --- Workflow definition ---

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
      const { json } = llmJson.extract(args.result);
      if (json.length > 0) {
        const parsed = json[0] as Partial<ParsedDocFields>;
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

    await workflow.sendEvent(ctx, {
      ...prdCompleteEvent,
      workflowId: doc.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "doc",
      entityId: String(args.docId),
      entityTitle: doc.title,
      rawResultEvent: args.rawResultEvent,
      repoId: doc.repoId,
      createdAt: Date.now(),
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

    await ctx.db.patch(args.docId, {
      activeWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleDoc,
      { docId: args.docId, workflowId: String(workflowId) },
    );

    return null;
  },
});
