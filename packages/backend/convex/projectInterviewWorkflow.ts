import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { PROJECT_INTERVIEW_SYSTEM_PROMPT, SPEC_SYSTEM_PROMPT } from "./prompts";
import { clearStreamingActivity, llmJson } from "./_taskWorkflow/helpers";

const projectInterviewCompleteEvent = defineEvent({
  name: "projectInterviewComplete",
  validator: workflowCompleteValidator,
});

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

function updateLastConversationEntry<
  T extends {
    role: "user" | "assistant";
    content: string;
    activityLog?: string;
  },
>(history: T[], content: string, activityLog: string | null | undefined): T[] {
  const updated = [...history];
  const last = updated[updated.length - 1];
  if (last) {
    last.content = content;
    last.activityLog = activityLog || undefined;
  }
  return updated;
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
    const fullPrompt = `${PROJECT_INTERVIEW_SYSTEM_PROMPT} ${questionPrompt}`;

    const { sandboxId } = await step.runAction(
      internal.daytona.prepareSandbox,
      {
        existingSandboxId: projectData.sandboxId,
        installationId: args.installationId,
        repoOwner: projectData.repoOwner,
        repoName: projectData.repoName,
        repoId: projectData.repoId,
      },
    );

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: args.projectId,
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
        { role: "assistant", content: "", activityLog: "" },
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
    await clearStreamingActivity(ctx, String(args.projectId));

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    if (!args.success || !args.result) {
      const messages = updateLastConversationEntry(
        project.conversationHistory,
        JSON.stringify({ error: true }),
        args.activityLog,
      );
      await ctx.db.patch(args.projectId, {
        conversationHistory: messages,
        activeWorkflowId: undefined,
        lastSandboxActivity: Date.now(),
      });
      return null;
    }

    const { json } = llmJson.extract(args.result);
    if (json.length === 0) {
      const messages = updateLastConversationEntry(
        project.conversationHistory,
        JSON.stringify({ error: true }),
        args.activityLog,
      );
      await ctx.db.patch(args.projectId, {
        conversationHistory: messages,
        activeWorkflowId: undefined,
        lastSandboxActivity: Date.now(),
      });
      return null;
    }

    const messages = updateLastConversationEntry(
      project.conversationHistory,
      JSON.stringify(json[0]),
      args.activityLog,
    );
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
    rawResultEvent: v.optional(v.string()),
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

    await ctx.db.insert("logs", {
      entityType: "project",
      entityId: String(args.projectId),
      entityTitle: project.title,
      rawResultEvent: args.rawResultEvent,
      repoId: project.repoId,
      createdAt: Date.now(),
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

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleProject,
      { projectId: args.projectId, workflowId: String(workflowId) },
    );

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

    const { sandboxId } = await step.runAction(
      internal.daytona.prepareSandbox,
      {
        existingSandboxId: projectData.sandboxId,
        installationId: args.installationId,
        repoOwner: projectData.repoOwner,
        repoName: projectData.repoName,
        repoId: projectData.repoId,
      },
    );

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: args.projectId,
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
    rawResultEvent: v.optional(v.string()),
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

    await ctx.db.insert("logs", {
      entityType: "project",
      entityId: String(args.projectId),
      entityTitle: project.title,
      rawResultEvent: args.rawResultEvent,
      repoId: project.repoId,
      createdAt: Date.now(),
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
    await clearStreamingActivity(ctx, String(args.projectId));

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    if (args.success && args.result) {
      const { json } = llmJson.extract(args.result);
      if (json.length > 0) {
        const specJson = JSON.stringify(json[0]);
        const messages = updateLastConversationEntry(
          project.conversationHistory,
          specJson,
          args.activityLog,
        );
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

    const messages = updateLastConversationEntry(
      project.conversationHistory,
      JSON.stringify({ error: true }),
      args.activityLog,
    );
    await ctx.db.patch(args.projectId, {
      conversationHistory: messages,
      activeWorkflowId: undefined,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});
