import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { getCurrentUserId } from "./auth";
import { LlmJson } from "@solvers-hub/llm-json";

const llmJson = new LlmJson({ attemptCorrection: true });

const prdCompleteEvent = defineEvent({
  name: "prdComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

const PARSE_PROMPT = `You are a product manager writing a PRD from an uploaded requirements document. Read CLAUDE.md and explore the codebase to understand existing product behavior, but write everything in plain business language.

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "description": "1-3 sentence description of what this feature does for the user",
  "requirements": ["Acceptance criterion 1", "Acceptance criterion 2"],
  "userFlows": [{"name": "Flow name", "steps": ["Step 1", "Step 2"]}]
}

## Guidelines
- Description: plain-English summary of what the user can do and why it matters
- Requirements: 5-15 acceptance criteria written as "The user can..." or "The system should..." statements. Each must be verifiable by a non-technical person just by using the product
- User flows: 2-5 step-by-step journeys written from the user's perspective (e.g. "User clicks the Create button", "User sees a confirmation message"). 3-8 steps each
- NEVER use technical language: no mention of APIs, databases, components, or code`;

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
    convexToken: v.string(),
    githubToken: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch doc + repo data, build prompt
    const docData = await step.runQuery(internal.docPrdWorkflow.getDocData, {
      docId: args.docId,
      prdContent: args.prdContent,
    });

    // Step 2: Setup sandbox + fire Claude CLI
    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.docId,
      existingSandboxId: docData.sandboxId,
      githubToken: args.githubToken,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      prompt: docData.prompt,
      convexToken: args.convexToken,
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
    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.docId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

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
export const handleCompletion = mutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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

    return null;
  },
});

/**
 * Public mutation to start the PRD parsing workflow from the frontend.
 */
export const startPrdParse = mutation({
  args: {
    docId: v.id("docs"),
    prdContent: v.string(),
    convexToken: v.string(),
    githubToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const workflowId = await workflow.start(
      ctx,
      internal.docPrdWorkflow.docPrdWorkflow,
      {
        docId: args.docId,
        prdContent: args.prdContent,
        convexToken: args.convexToken,
        githubToken: args.githubToken,
      },
    );

    await ctx.db.patch(args.docId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
