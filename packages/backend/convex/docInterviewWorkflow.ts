import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { GENERATE_PROMPT, INTERVIEW_PROMPT } from "./prompts";

const llmJson = new LlmJson({ attemptCorrection: true });

const docInterviewCompleteEvent = defineEvent({
  name: "docInterviewComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

interface PreviousAnswer {
  question: string;
  answer: string;
}

function buildQuestionPrompt(
  docTitle: string,
  previousAnswers: PreviousAnswer[],
): string {
  let prompt = `## Document: "${docTitle}"\n\n`;

  if (previousAnswers.length > 0) {
    prompt += `## Already Decided\n`;
    previousAnswers.forEach((a, i) => {
      prompt += `${i + 1}. ${a.question} → ${a.answer}\n`;
    });
    prompt += "\n";
  }

  prompt += `## Your Task
Ask ONE question about this feature from a product perspective — who uses it, what they experience, what happens in edge cases, or what success looks like.

If you have enough information (typically after 3-6 questions), output {"ready": true} instead.

Output ONLY valid JSON:
{"question": "your question", "options": [{"label": "Short name", "description": "Explanation"}]}
OR
{"ready": true}`;

  return prompt;
}

// --- Workflow definition ---

export const docInterviewWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    docTitle: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch doc + repo data, build question prompt
    const docData = await step.runQuery(
      internal.docInterviewWorkflow.getDocData,
      { docId: args.docId },
    );

    // Step 2: Add empty assistant message for streaming
    await step.runMutation(internal.docInterviewWorkflow.addEmptyAssistant, {
      docId: args.docId,
    });

    const questionPrompt = buildQuestionPrompt(
      args.docTitle,
      args.previousAnswers,
    );
    const fullPrompt = `${INTERVIEW_PROMPT} ${questionPrompt}`;

    // Step 3: Setup sandbox + fire Claude CLI for the question
    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.docId,
      existingSandboxId: docData.sandboxId,
      installationId: args.installationId,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      prompt: fullPrompt,
      userId: args.userId,
      completionMutation: "docInterviewWorkflow:handleCompletion",
      entityIdField: "docId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      repoId: docData.repoId,
    });

    // Step 4: Wait for callback
    const result = await step.awaitEvent(docInterviewCompleteEvent);

    // Step 5: Save the result (question or generated content)
    await step.runMutation(internal.docInterviewWorkflow.saveResult, {
      docId: args.docId,
      docTitle: args.docTitle,
      previousAnswers: args.previousAnswers,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
    });
  },
});

// --- Supporting internal functions ---

export const getDocData = internalQuery({
  args: { docId: v.id("docs") },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    return {
      sandboxId: doc.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: doc.repoId,
    };
  },
});

export const addEmptyAssistant = internalMutation({
  args: { docId: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const history = doc.interviewHistory ?? [];
    history.push({
      role: "assistant",
      content: "",
      activityLog: "",
    });
    await ctx.db.patch(args.docId, { interviewHistory: history });
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    docId: v.id("docs"),
    docTitle: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
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

    if (!args.success || !args.result) {
      // Update last interview message with error
      const history = [...(doc.interviewHistory ?? [])];
      const last = history[history.length - 1];
      if (last) {
        last.content = JSON.stringify({ error: true });
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.docId, {
        interviewHistory: history,
        activeWorkflowId: undefined,
      });
      return null;
    }

    const { json } = llmJson.extract(args.result);
    if (json.length === 0) {
      const history = [...(doc.interviewHistory ?? [])];
      const last = history[history.length - 1];
      if (last) {
        last.content = JSON.stringify({ error: true });
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.docId, {
        interviewHistory: history,
        activeWorkflowId: undefined,
      });
      return null;
    }

    const parsed = json[0] as { ready?: boolean; question?: string };
    const jsonStr = JSON.stringify(json[0]);

    if (parsed.ready === true) {
      // The interview is complete — need to generate content
      // For now, save the ready signal. The generate phase will run
      // as a separate workflow invocation triggered by the frontend.
      // This keeps the workflow simple and avoids a second sandbox call.
      const history = [...(doc.interviewHistory ?? [])];
      const last = history[history.length - 1];
      if (last) {
        last.content = jsonStr;
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.docId, {
        interviewHistory: history,
        activeWorkflowId: undefined,
      });
    } else {
      // Save the question to interview history
      const history = [...(doc.interviewHistory ?? [])];
      const last = history[history.length - 1];
      if (last) {
        last.content = jsonStr;
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.docId, {
        interviewHistory: history,
        activeWorkflowId: undefined,
      });
    }

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
    costUsd: v.optional(v.number()),
    model: v.optional(v.string()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...docInterviewCompleteEvent,
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
      costUsd: args.costUsd ?? 0,
      model: args.model ?? "sonnet",
      rawResultEvent: args.rawResultEvent,
      repoId: doc.repoId,
      createdAt: Date.now(),
    });

    return null;
  },
});

/**
 * Public mutation to start a doc interview question workflow from the frontend.
 */
export const startInterview = authMutation({
  args: {
    docId: v.id("docs"),
    docTitle: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const workflowId = await workflow.start(
      ctx,
      internal.docInterviewWorkflow.docInterviewWorkflow,
      {
        docId: args.docId,
        docTitle: args.docTitle,
        previousAnswers: args.previousAnswers,
        userId: ctx.userId,
        installationId: args.installationId,
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

/**
 * Separate workflow for the generate phase after interview is complete.
 */
export const docGenerateWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    docTitle: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    const docData = await step.runQuery(
      internal.docInterviewWorkflow.getDocData,
      { docId: args.docId },
    );

    await step.runMutation(internal.docInterviewWorkflow.addEmptyAssistant, {
      docId: args.docId,
    });

    const answersText = args.previousAnswers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");

    const prompt = `${GENERATE_PROMPT}

Feature: "${args.docTitle}"

Interview answers:
${answersText}

Generate a product description, acceptance criteria, and user journeys for this feature. Write everything from the user's perspective in plain language.

Output ONLY valid JSON.`;

    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.docId,
      existingSandboxId: docData.sandboxId,
      installationId: args.installationId,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      prompt,
      userId: args.userId,
      completionMutation: "docInterviewWorkflow:handleGenerateCompletion",
      entityIdField: "docId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      repoId: docData.repoId,
    });

    const result = await step.awaitEvent(docInterviewCompleteEvent);

    await step.runMutation(internal.docInterviewWorkflow.saveGenerateResult, {
      docId: args.docId,
      success: result.success,
      result: result.result,
      activityLog: result.activityLog,
    });
  },
});

export const handleGenerateCompletion = authMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    costUsd: v.optional(v.number()),
    model: v.optional(v.string()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...docInterviewCompleteEvent,
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
      costUsd: args.costUsd ?? 0,
      model: args.model ?? "sonnet",
      rawResultEvent: args.rawResultEvent,
      repoId: doc.repoId,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const saveGenerateResult = internalMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
        const generated = json[0] as {
          description?: string;
          requirements?: string[];
          userFlows?: Array<{ name: string; steps: string[] }>;
        };

        // Update doc with generated content
        await ctx.db.patch(args.docId, {
          description: generated.description,
          requirements: generated.requirements,
          userFlows: generated.userFlows,
          updatedAt: Date.now(),
        });

        // Update last interview message
        const history = [...(doc.interviewHistory ?? [])];
        const last = history[history.length - 1];
        if (last) {
          last.content = JSON.stringify(json[0]);
          last.activityLog = args.activityLog || undefined;
        }
        await ctx.db.patch(args.docId, {
          interviewHistory: history,
          activeWorkflowId: undefined,
        });
        return null;
      }
    }

    // On failure
    const history = [...(doc.interviewHistory ?? [])];
    const last = history[history.length - 1];
    if (last) {
      last.content = JSON.stringify({ error: true });
      last.activityLog = args.activityLog || undefined;
    }
    await ctx.db.patch(args.docId, {
      interviewHistory: history,
      activeWorkflowId: undefined,
    });
    return null;
  },
});

/**
 * Public mutation to start the generate phase from the frontend.
 */
export const startGenerate = authMutation({
  args: {
    docId: v.id("docs"),
    docTitle: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const workflowId = await workflow.start(
      ctx,
      internal.docInterviewWorkflow.docGenerateWorkflow,
      {
        docId: args.docId,
        docTitle: args.docTitle,
        previousAnswers: args.previousAnswers,
        userId: ctx.userId,
        installationId: args.installationId,
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
