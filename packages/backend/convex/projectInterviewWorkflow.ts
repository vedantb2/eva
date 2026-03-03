import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";

const llmJson = new LlmJson({ attemptCorrection: true });

const projectInterviewCompleteEvent = defineEvent({
  name: "projectInterviewComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

const SYSTEM_PROMPT = `You are a product-minded engineer helping a user spec out a feature before building it. You have access to their codebase and understand how it works.

## Before You Ask
Read CLAUDE.md and explore relevant files (Glob, Grep, Read) BEFORE formulating your question. Ground every question in real code you've seen.

## Your Role
- Ask questions that actually matter for implementation — things that would block you or lead to rework if you guessed wrong
- Ground your questions in the real codebase: reference existing patterns, pages, or behaviors the user already has
- Each question should include a brief example or scenario so the user understands why it matters
- Use plain language but you CAN reference things the user would recognize (e.g. "the settings page", "your current notification system", "the sidebar")

## Format Rules
- Question: 1-3 sentences. Include a concrete example or "for instance..." to illustrate why the question matters.
- Options: 2-4 options, each with a short label and a description explaining what it means and why it matters.
- Do NOT ask about purely technical choices (database schema, state management library, API design)
- Do NOT repeat topics already covered in previous answers

## Readiness
If you believe all critical decisions are covered and you have enough information to create a comprehensive implementation plan, output {"ready": true} instead of a question.

## Output Format
You MUST output ONLY valid JSON with one of these structures:
{"question": "your question here", "options": [{"label": "Short name", "description": "What this means and why it matters"}]}
OR
{"ready": true}`;

const TASK_PHILOSOPHY = `
TASK GRANULARITY RULES:
- Each task should represent ONE ownership boundary in the codebase
- A task should encompass all related changes within that boundary (multiple file edits are expected)
- Think in terms of: "core capability/infrastructure" vs "user-facing integration/UI"
- Aim for 2-5 tasks total, NOT 10+ micro-tasks

SUBTASKS:
- Each task MUST have 3-7 subtasks that serve as a checklist for the agent
- Subtasks should be discrete, actionable items the agent will mark as complete
- Subtasks should be specific enough that completion is unambiguous

Each task description should specify ALL the changes needed within that ownership boundary.`;

const SPEC_SYSTEM_PROMPT = `You are a technical architect. Read CLAUDE.md first to understand the codebase, then create a detailed implementation plan based on the feature description and interview answers.
${TASK_PHILOSOPHY}

Reference actual file paths and follow the project's existing patterns and conventions.

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "title": "Clear, concise feature title (max 60 chars)",
  "description": "Detailed description of the feature including scope and goals",
  "tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "dependencies": [1, 2],
      "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
    }
  ]
}`;

interface PreviousAnswer {
  question: string;
  answer: string;
}

function buildQuestionPrompt(
  featureDescription: string,
  previousAnswers: PreviousAnswer[],
  rejectionReason?: string,
): string {
  let prompt = `## Feature Request\n"${featureDescription}"\n\n`;

  if (previousAnswers.length > 0) {
    prompt += `## Already Decided\n`;
    previousAnswers.forEach((a, i) => {
      prompt += `${i + 1}. ${a.question} → ${a.answer}\n`;
    });
    prompt += "\n";
  }

  if (rejectionReason) {
    prompt += `## Important Context\nThe user previously received a generated plan but rejected it with this feedback: "${rejectionReason}"\nAsk a question that directly addresses what the user felt was missing or wrong.\n\n`;
  }

  prompt += `## Your Task
Ask ONE question about a decision that would actually affect how this feature gets built. Ground it in the existing codebase where possible — reference real pages, components, or behaviors the user already has.

Include a brief example or scenario in the question so the user understands the tradeoff.

If you believe all critical decisions are covered, output {"ready": true} instead.

Output ONLY valid JSON:
{"question": "your question", "options": [{"label": "Short name", "description": "Explanation"}]}
OR
{"ready": true}`;

  return prompt;
}

// --- Workflow definition ---

export const projectInterviewWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    featureDescription: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    rejectionReason: v.optional(v.string()),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch project + repo data
    const projectData = await step.runQuery(
      internal.projectInterviewWorkflow.getProjectData,
      { projectId: args.projectId },
    );

    // Step 2: Add empty assistant message for streaming
    await step.runMutation(
      internal.projectInterviewWorkflow.addEmptyAssistant,
      { projectId: args.projectId },
    );

    const questionPrompt = buildQuestionPrompt(
      args.featureDescription,
      args.previousAnswers,
      args.rejectionReason,
    );
    const fullPrompt = `${SYSTEM_PROMPT} ${questionPrompt}`;

    // Step 3: Setup sandbox + fire Claude CLI
    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.projectId,
      existingSandboxId: projectData.sandboxId,
      installationId: args.installationId,
      repoOwner: projectData.repoOwner,
      repoName: projectData.repoName,
      prompt: fullPrompt,
      userId: args.userId,
      completionMutation: "projectInterviewWorkflow:handleCompletion",
      entityIdField: "projectId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      repoId: projectData.repoId,
    });

    // Step 4: Wait for callback
    const result = await step.awaitEvent(projectInterviewCompleteEvent);

    // Step 5: Save the result
    await step.runMutation(internal.projectInterviewWorkflow.saveResult, {
      projectId: args.projectId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
    });
  },
});

// --- Supporting internal functions ---

export const getProjectData = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    return {
      sandboxId: project.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: project.repoId,
    };
  },
});

export const addEmptyAssistant = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(args.projectId, {
      conversationHistory: [
        ...project.conversationHistory,
        { role: "assistant" as const, content: "", activityLog: "" },
      ],
    });
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    projectId: v.id("projects"),
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
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.projectId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    if (!args.success || !args.result) {
      const messages = [...project.conversationHistory];
      const last = messages[messages.length - 1];
      if (last) {
        last.content = JSON.stringify({ error: true });
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.projectId, {
        conversationHistory: messages,
        activeWorkflowId: undefined,
        lastSandboxActivity: Date.now(),
      });
      return null;
    }

    const { json } = llmJson.extract(args.result);
    if (json.length === 0) {
      const messages = [...project.conversationHistory];
      const last = messages[messages.length - 1];
      if (last) {
        last.content = JSON.stringify({ error: true });
        last.activityLog = args.activityLog || undefined;
      }
      await ctx.db.patch(args.projectId, {
        conversationHistory: messages,
        activeWorkflowId: undefined,
        lastSandboxActivity: Date.now(),
      });
      return null;
    }

    const jsonStr = JSON.stringify(json[0]);
    const messages = [...project.conversationHistory];
    const last = messages[messages.length - 1];
    if (last) {
      last.content = jsonStr;
      last.activityLog = args.activityLog || undefined;
    }
    await ctx.db.patch(args.projectId, {
      conversationHistory: messages,
      activeWorkflowId: undefined,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

/**
 * Called by sandbox via Convex HTTP API (authenticated with Clerk JWT).
 */
export const handleCompletion = authMutation({
  args: {
    projectId: v.id("projects"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !project.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...projectInterviewCompleteEvent,
      workflowId: project.activeWorkflowId as WorkflowId,
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
 * Public mutation to start a project interview question.
 */
export const startInterview = authMutation({
  args: {
    projectId: v.id("projects"),
    featureDescription: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    rejectionReason: v.optional(v.string()),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const workflowId = await workflow.start(
      ctx,
      internal.projectInterviewWorkflow.projectInterviewWorkflow,
      {
        projectId: args.projectId,
        featureDescription: args.featureDescription,
        previousAnswers: args.previousAnswers,
        rejectionReason: args.rejectionReason,
        userId: ctx.userId,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.projectId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

// --- Spec generation workflow (when interview is ready) ---

export const projectSpecWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    featureDescription: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    const projectData = await step.runQuery(
      internal.projectInterviewWorkflow.getProjectData,
      { projectId: args.projectId },
    );

    await step.runMutation(
      internal.projectInterviewWorkflow.addEmptyAssistant,
      { projectId: args.projectId },
    );

    const answersText = args.previousAnswers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");

    const prompt = `${SPEC_SYSTEM_PROMPT}

Feature: "${args.featureDescription}"

Interview answers:
${answersText}

Generate an implementation spec with 2-5 tasks. Each task should represent a complete ownership boundary (e.g., "backend infrastructure" or "UI integration"), not a single micro-edit. Tasks should be comprehensive enough that completing one task means that entire area of the codebase is done.

Output ONLY valid JSON.`;

    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.projectId,
      existingSandboxId: projectData.sandboxId,
      installationId: args.installationId,
      repoOwner: projectData.repoOwner,
      repoName: projectData.repoName,
      prompt,
      userId: args.userId,
      completionMutation: "projectInterviewWorkflow:handleSpecCompletion",
      entityIdField: "projectId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      repoId: projectData.repoId,
    });

    const result = await step.awaitEvent(projectInterviewCompleteEvent);

    await step.runMutation(internal.projectInterviewWorkflow.saveSpecResult, {
      projectId: args.projectId,
      success: result.success,
      result: result.result,
      activityLog: result.activityLog,
    });
  },
});

export const handleSpecCompletion = authMutation({
  args: {
    projectId: v.id("projects"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !project.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...projectInterviewCompleteEvent,
      workflowId: project.activeWorkflowId as WorkflowId,
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

export const saveSpecResult = internalMutation({
  args: {
    projectId: v.id("projects"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.projectId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    if (args.success && args.result) {
      const { json } = llmJson.extract(args.result);
      if (json.length > 0) {
        const specJson = JSON.stringify(json[0]);
        const messages = [...project.conversationHistory];
        const last = messages[messages.length - 1];
        if (last) {
          last.content = specJson;
          last.activityLog = args.activityLog || undefined;
        }
        await ctx.db.patch(args.projectId, {
          conversationHistory: messages,
          generatedSpec: specJson,
          phase: "finalized",
          activeWorkflowId: undefined,
          lastSandboxActivity: Date.now(),
        });
        return null;
      }
    }

    // On failure
    const messages = [...project.conversationHistory];
    const last = messages[messages.length - 1];
    if (last) {
      last.content = JSON.stringify({ error: true });
      last.activityLog = args.activityLog || undefined;
    }
    await ctx.db.patch(args.projectId, {
      conversationHistory: messages,
      activeWorkflowId: undefined,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

/**
 * Public mutation to start the spec generation phase.
 */
export const startSpec = authMutation({
  args: {
    projectId: v.id("projects"),
    featureDescription: v.string(),
    previousAnswers: v.array(
      v.object({ question: v.string(), answer: v.string() }),
    ),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const workflowId = await workflow.start(
      ctx,
      internal.projectInterviewWorkflow.projectSpecWorkflow,
      {
        projectId: args.projectId,
        featureDescription: args.featureDescription,
        previousAnswers: args.previousAnswers,
        userId: ctx.userId,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.projectId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
