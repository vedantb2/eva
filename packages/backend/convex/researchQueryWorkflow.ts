import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";

// --- Shared completion event ---

const queryCompleteEvent = defineEvent({
  name: "researchQueryComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

// --- Prompt builders ---

function stripCodeFences(text: string): string {
  const match = text.match(/```(?:\w+)?\n([\s\S]+?)```/);
  return (match ? match[1] : text).trim();
}

function buildGeneratePrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Generate a single Convex database query to answer the user's question. Do NOT execute anything — output ONLY the raw query code with no markdown, no explanation, no backticks.

## Step 1: Read the Schema
Before generating any query, read the database schema and validators to understand all tables, fields, and indexes:
- cat packages/backend/convex/schema.ts
- cat packages/backend/convex/validators.ts

Use ONLY the indexes defined in schema.ts. NEVER invent indexes — they will cause errors. To filter by a field without an index, collect all rows first, then use .filter() in JavaScript.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}
- All database timestamps are in milliseconds since epoch (Unix ms). Use Date.now() in queries for current time. For "today", subtract 24*60*60*1000 from Date.now().

## Current Repository ID
repoId: "${repoId}"

## CRITICAL RULES
- Return ONLY the raw query code. No markdown, no explanation, no wrapping in backticks.
- Filter by repoId where applicable.
- For agentTasks: query boards by repoId first, then tasks by boardId.
- For agentRuns: query tasks first, then runs by taskId.

## Query Format
Every query MUST use this exact wrapper:
import { query } from "convex:/_system/repl/wrappers.js";
export default query({ handler: async (ctx) => {
  // your query logic here
  return result;
}});

## Query Examples
- With index: await ctx.db.query("sessions").withIndex("by_repo", q => q.eq("repoId", "${repoId}")).collect()
- Order desc: await ctx.db.query("agentRuns").order("desc").take(20)
- Get by ID: await ctx.db.get(someId)`;
}

function buildAnalysePrompt(repoId: string): string {
  const now = new Date();
  return `You are a data analyst. Execute the provided Convex database query and analyze the results.

## How to Execute
Write the query code to /tmp/query.js, then run it using this pattern:

cat > /tmp/query.js << 'QUERYEOF'
<paste the query code here>
QUERYEOF

cat > /tmp/run.mjs << 'RUNEOF'
import { readFileSync } from "fs";
const code = readFileSync("/tmp/query.js", "utf8");
const res = await fetch(process.env.CONVEX_CLOUD_URL + "/api/run_test_function", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ adminKey: process.env.CONVEX_DEPLOY_KEY, args: {}, bundle: { path: "testQuery.js", source: code }, format: "convex_encoded_json" }),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
RUNEOF

node /tmp/run.mjs

If the query fails, you may fix the query code and retry once.

## Current Time
- UTC: ${now.toISOString()}
- Timestamp (ms): ${now.getTime()}

## Current Repository ID
repoId: "${repoId}"

## Analysis Guidelines
1. Execute the provided query
2. Analyze the results thoroughly
3. Present findings in a structured, analyst-friendly format:
   - Lead with the key metric or direct answer
   - **Bold** important numbers, metrics, names, and key takeaways
   - Use tables, lists, or breakdowns where appropriate
   - Highlight trends, outliers, or notable patterns
   - Include percentages and comparisons when relevant
4. NEVER include raw database IDs (like _id, repoId, boardId, userId) unless the user explicitly asks for raw data
5. Use names, titles, statuses, and human-readable labels
6. If results are empty, say so clearly and suggest what the user might query instead`;
}

// --- Workflow definitions ---

export const generateQueryWorkflow = workflow.define({
  args: {
    queryId: v.id("researchQueries"),
    question: v.string(),
    repoId: v.id("githubRepos"),
    model: v.string(),
    convexToken: v.string(),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(internal.researchQueryWorkflow.addMessages, {
      queryId: args.queryId,
      question: args.question,
    });

    const data = await step.runQuery(
      internal.researchQueryWorkflow.getGenerateData,
      { repoId: args.repoId, question: args.question },
    );

    const { sandboxId } = await step.runAction(
      internal.daytona.setupAndExecute,
      {
        entityId: String(args.queryId),
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        prompt: data.prompt,
        convexToken: args.convexToken,
        completionMutation: "researchQueryWorkflow:handleCompletion",
        entityIdField: "queryId",
        model: args.model || "sonnet",
        allowedTools: "Bash",
        repoId: args.repoId,
      },
    );

    const result = await step.awaitEvent(queryCompleteEvent);

    await step.runMutation(internal.researchQueryWorkflow.saveGenerateResult, {
      queryId: args.queryId,
      sandboxId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
    });
  },
});

export const confirmQueryWorkflow = workflow.define({
  args: {
    queryId: v.id("researchQueries"),
    queryCode: v.string(),
    messageId: v.id("messages"),
    question: v.string(),
    repoId: v.id("githubRepos"),
    convexToken: v.string(),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(internal.researchQueryWorkflow.markConfirmed, {
      queryId: args.queryId,
      messageId: args.messageId,
      queryCode: args.queryCode,
    });

    const data = await step.runQuery(
      internal.researchQueryWorkflow.getConfirmData,
      {
        repoId: args.repoId,
        question: args.question,
        queryCode: args.queryCode,
        queryId: args.queryId,
      },
    );

    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: String(args.queryId),
      existingSandboxId: data.sandboxId,
      installationId: args.installationId,
      repoOwner: data.repoOwner,
      repoName: data.repoName,
      prompt: data.prompt,
      convexToken: args.convexToken,
      completionMutation: "researchQueryWorkflow:handleCompletion",
      entityIdField: "queryId",
      model: "sonnet",
      allowedTools: "Bash",
      repoId: args.repoId,
    });

    const result = await step.awaitEvent(queryCompleteEvent);

    await step.runMutation(internal.researchQueryWorkflow.saveConfirmResult, {
      queryId: args.queryId,
      messageId: args.messageId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
    });
  },
});

// --- Supporting internal functions ---

export const addMessages = internalMutation({
  args: {
    queryId: v.id("researchQueries"),
    question: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.queryId);
    if (!rq) throw new Error("Research query not found");
    const now = Date.now();
    await ctx.db.insert("messages", {
      parentId: args.queryId,
      role: "user",
      content: args.question,
      timestamp: now,
      userId: rq.userId,
    });
    await ctx.db.insert("messages", {
      parentId: args.queryId,
      role: "assistant",
      content: "",
      timestamp: now,
    });
    await ctx.db.patch(args.queryId, { updatedAt: now });
    return null;
  },
});

export const getGenerateData = internalQuery({
  args: {
    repoId: v.id("githubRepos"),
    question: v.string(),
  },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    const prompt = `${buildGeneratePrompt(String(args.repoId))}\n\nQuestion: ${args.question}`;
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      prompt,
    };
  },
});

export const getConfirmData = internalQuery({
  args: {
    repoId: v.id("githubRepos"),
    question: v.string(),
    queryCode: v.string(),
    queryId: v.id("researchQueries"),
  },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
    sandboxId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    const rq = await ctx.db.get(args.queryId);

    const prompt = `${buildAnalysePrompt(String(args.repoId))}\n\nUser's question: ${args.question}\n\nQuery to execute:\n${args.queryCode}`;
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      prompt,
      sandboxId: rq?.sandboxId,
    };
  },
});

export const markConfirmed = internalMutation({
  args: {
    queryId: v.id("researchQueries"),
    messageId: v.id("messages"),
    queryCode: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "confirmed",
      queryCode: args.queryCode,
      content: "",
    });
    await ctx.db.patch(args.queryId, { updatedAt: Date.now() });
    return null;
  },
});

export const saveGenerateResult = internalMutation({
  args: {
    queryId: v.id("researchQueries"),
    sandboxId: v.string(),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.queryId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.queryId))
      .order("desc")
      .first();
    if (!last) return null;

    if (args.success && args.result) {
      const queryCode = stripCodeFences(args.result);
      const patch: {
        content: string;
        queryCode: string;
        status: "pending";
        activityLog?: string;
      } = {
        content: queryCode,
        queryCode,
        status: "pending",
      };
      if (args.activityLog) patch.activityLog = args.activityLog;
      await ctx.db.patch(last._id, patch);
    } else {
      const patch: { content: string; activityLog?: string } = {
        content: `Error generating query: ${args.error || "Unknown error"}`,
      };
      if (args.activityLog) patch.activityLog = args.activityLog;
      await ctx.db.patch(last._id, patch);
    }

    await ctx.db.patch(args.queryId, {
      updatedAt: Date.now(),
      activeWorkflowId: undefined,
      sandboxId: args.sandboxId,
    });
    return null;
  },
});

export const saveConfirmResult = internalMutation({
  args: {
    queryId: v.id("researchQueries"),
    messageId: v.id("messages"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.queryId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const patch: {
      content: string;
      status: "confirmed";
      activityLog?: string;
    } = {
      content:
        args.success && args.result
          ? args.result
          : `Error executing query: ${args.error || "Unknown error"}`,
      status: "confirmed",
    };
    if (args.activityLog) patch.activityLog = args.activityLog;
    await ctx.db.patch(args.messageId, patch);

    await ctx.db.patch(args.queryId, {
      updatedAt: Date.now(),
      activeWorkflowId: undefined,
    });
    return null;
  },
});

// --- Public mutations ---

export const handleCompletion = authMutation({
  args: {
    queryId: v.id("researchQueries"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.queryId);
    if (!rq || !rq.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...queryCompleteEvent,
      workflowId: rq.activeWorkflowId as WorkflowId,
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

export const startGenerate = authMutation({
  args: {
    queryId: v.id("researchQueries"),
    question: v.string(),
    repoId: v.id("githubRepos"),
    model: v.string(),
    convexToken: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.queryId);
    if (!rq) throw new Error("Research query not found");

    const workflowId = await workflow.start(
      ctx,
      internal.researchQueryWorkflow.generateQueryWorkflow,
      {
        queryId: args.queryId,
        question: args.question,
        repoId: args.repoId,
        model: args.model,
        convexToken: args.convexToken,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.queryId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const startConfirm = authMutation({
  args: {
    queryId: v.id("researchQueries"),
    queryCode: v.string(),
    messageId: v.id("messages"),
    question: v.string(),
    repoId: v.id("githubRepos"),
    convexToken: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.queryId);
    if (!rq) throw new Error("Research query not found");

    const workflowId = await workflow.start(
      ctx,
      internal.researchQueryWorkflow.confirmQueryWorkflow,
      {
        queryId: args.queryId,
        queryCode: args.queryCode,
        messageId: args.messageId,
        question: args.question,
        repoId: args.repoId,
        convexToken: args.convexToken,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.queryId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
