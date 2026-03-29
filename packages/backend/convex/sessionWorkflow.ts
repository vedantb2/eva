import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation, hasRepoAccess } from "./functions";
import { sessionModeValidator, workflowCompleteValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import {
  buildRootDirectoryInstruction,
  getResponseLengthInstruction,
} from "./prompts";

// --- Completion event ---

const sessionCompleteEvent = defineEvent({
  name: "sessionComplete",
  validator: workflowCompleteValidator,
});

// --- Mode config ---

const MODE_TOOLS: Record<"ask" | "plan" | "execute", string> = {
  ask: "Read,Glob,Grep,Bash",
  plan: "Read,Write,Glob,Grep",
  execute: "Read,Write,Edit,Bash,Glob,Grep",
};

const WORKSPACE_DIR = "/workspace/repo";

// --- Prompt builders ---

function buildAskPrompt(
  repo: { owner: string; name: string },
  message: string,
  responseLength: string,
  rootDirectory: string,
): string {
  return `You are answering questions about a codebase for a non-technical user. READ-ONLY mode — do NOT modify any files.

Repository: ${repo.owner}/${repo.name}

Question: ${message}

You have full access to this machine. Use Glob, Grep, Read to explore code, and Bash to run commands (check logs, curl endpoints, inspect running services, etc). Do NOT modify any files.

Response rules:
- Write for a non-technical audience — explain in business and product terms, not code or implementation
- Never include code snippets, file paths, function names, or technical jargon
- You may casually reference parts of the product (e.g. "the login page", "the settings screen") but not source files
- Use markdown formatting: headers, bullet points, tables where they aid clarity
- When explaining architecture, data flow, or relationships, use a mermaid diagram (fenced \`\`\`mermaid block) to visualise it — this helps non-technical users understand at a glance
- Keep explanations concise and jargon-free; diagrams can replace lengthy prose${getResponseLengthInstruction(responseLength)}${buildRootDirectoryInstruction(rootDirectory)}`;
}

function buildPlanPrompt(
  repo: { owner: string; name: string },
  existingPlan: string,
  message: string,
  responseLength: string,
  rootDirectory: string,
): string {
  return `You are a product planning assistant helping define a PRD for a feature or change.

## Repository: ${repo.owner}/${repo.name}

## Current plan.md:
${existingPlan || "No plan created yet."}

## User Message:
${message}

## Instructions:
1. Use Glob, Grep, Read to explore the codebase
2. Create or update plan.md in the repository root with the full PRD
3. Refine based on user feedback — don't rewrite from scratch unless asked
4. Structure: Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope

## Rules:
- ONLY write to plan.md — do NOT modify other files
- Response: 1-2 sentences on what changed in the plan
- Non-technical audience — WHAT and WHY, not HOW
- Do NOT commit or push${getResponseLengthInstruction(responseLength)}${buildRootDirectoryInstruction(rootDirectory)}`;
}

function buildExecutePrompt(
  repo: { owner: string; name: string },
  branchName: string,
  planContent: string,
  message: string,
  responseLength: string,
  rootDirectory: string,
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const planContext = planContent
    ? `\n\n## Approved Product Plan:\n${planContent}\n\nUse this plan as context for what to build and why. Follow the goals, user stories, and acceptance criteria defined above.`
    : "";
  return `You are working on an ongoing session. You have full admin access to this sandboxed machine — install packages, run dev servers, execute any commands you need.

## User Request:
${message}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${branchName}

You are already on branch "${branchName}". All work MUST stay on this branch.${planContext}

## Instructions:
1. Read CLAUDE.md if it exists
2. Use Glob, Grep, Read to find relevant files
3. Make changes using Edit or Write
4. Only if you made code changes, commit and push:
   git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}" && git push -u origin ${branchName}
5. Respond with a concise summary of what you did

## Rules:
- NEVER checkout, push to, or interact with main — only "${branchName}"
- Do NOT create PRs, run build/lint/test/dev commands, or commit if no source code changed
- NEVER commit image or video files
- Make minimal, focused changes
- Use the lockfile for package manager. GITHUB_TOKEN is set for git operations.
- Frame your response as a business outcome with light technical context (e.g. "Added dark mode toggle to settings. Changes pushed to branch.")
- Never include code snippets, file paths, function names, or implementation details in your response
- Do NOT mention commit hashes, process meta-commentary, or internal tooling steps
- For browser interaction (screenshots, visual proof), use the agent-browser skill. Before using agent-browser, check CDP: \`curl -sf http://localhost:9222/json/version > /dev/null && echo "CDP" || echo "NO_CDP"\`. If CDP: use \`agent-browser --cdp 9222\` for all commands (skip \`set viewport\`, VNC Chrome is already 1920x1080). If NO_CDP: run \`agent-browser set viewport 1920 1080\` first. Always use \`--annotate\` for screenshots. Save to screenshots/ or recordings/.${getResponseLengthInstruction(responseLength)}${buildRootDirectoryInstruction(rootDirectory)}`;
}

// --- Workflow ---

const sessionModeArgValidator = v.union(
  v.literal("execute"),
  v.literal("ask"),
  v.literal("plan"),
);

export const sessionExecuteWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: v.string(),
    responseLength: v.string(),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(internal.sessionWorkflow.addAssistantPlaceholder, {
      sessionId: args.sessionId,
      mode: args.mode,
    });

    const data = await step.runQuery(internal.sessionWorkflow.getSessionData, {
      sessionId: args.sessionId,
      message: args.message,
      mode: args.mode,
      model: args.model,
      responseLength: args.responseLength,
    });

    let validatedSandboxId: string | null = null;

    if (data.sandboxId) {
      const validation = await step.runAction(
        internal.daytona.validateSandbox,
        { sandboxId: data.sandboxId, repoId: data.repoId },
        { retry: false },
      );
      validatedSandboxId = validation.healthy ? data.sandboxId : null;
    }

    let sandboxId: string;

    if (validatedSandboxId) {
      sandboxId = validatedSandboxId;
    } else {
      const prepared = await step.runAction(
        internal.daytona.prepareSessionSandbox,
        {
          sessionId: args.sessionId,
          existingSandboxId: data.sandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName ?? `eva/session-${args.sessionId}`,
          baseBranch: data.baseBranch,
          repoId: data.repoId,
          startDesktop: true,
        },
        { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = prepared.sandboxId;

      await step.runMutation(internal.sessionWorkflow.updateSandboxId, {
        sessionId: args.sessionId,
        sandboxId,
        branchName: data.branchName,
      });
    }

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: args.sessionId,
      prompt: data.prompt,
      userId: args.userId,
      completionMutation: "sessionWorkflow:handleCompletion",
      entityIdField: "sessionId",
      model: data.model,
      allowedTools: data.allowedTools,
      repoId: data.repoId,
      sessionPersistenceId: args.sessionId,
      streamingEntityId: args.sessionId,
    });

    const result = await step.awaitEvent(sessionCompleteEvent);

    let planContent: string | undefined;

    if (args.mode === "plan" && result.success && sandboxId) {
      const planRaw = await step.runAction(internal.daytona.runSandboxCommand, {
        sandboxId,
        command: `cat ${WORKSPACE_DIR}/plan.md 2>/dev/null || echo ""`,
        timeoutSeconds: 10,
        repoId: data.repoId,
      });
      if (planRaw.trim()) {
        planContent = planRaw.trim();
      }
    }

    await step.runMutation(internal.sessionWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
      planContent,
    });
  },
});

// --- Supporting internal functions ---

export const addAssistantPlaceholder = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mode: sessionModeArgValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      mode: args.mode,
      activityLog: "",
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return null;
  },
});

export const getSessionData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: v.string(),
    responseLength: v.string(),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.string(),
    allowedTools: v.string(),
    model: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const rootDirectory = repo.rootDirectory ?? "";

    const branchName =
      args.mode === "ask"
        ? undefined
        : session.branchName || `eva/session-${args.sessionId}`;

    let prompt: string;
    if (args.mode === "ask") {
      prompt = buildAskPrompt(
        { owner: repo.owner, name: repo.name },
        args.message,
        args.responseLength,
        rootDirectory,
      );
    } else if (args.mode === "plan") {
      prompt = buildPlanPrompt(
        { owner: repo.owner, name: repo.name },
        session.planContent || "",
        args.message,
        args.responseLength,
        rootDirectory,
      );
    } else {
      prompt = buildExecutePrompt(
        { owner: repo.owner, name: repo.name },
        branchName || "",
        session.planContent || "",
        args.message,
        args.responseLength,
        rootDirectory,
      );
    }

    return {
      sandboxId: session.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      baseBranch: repo.defaultBaseBranch ?? "main",
      allowedTools: MODE_TOOLS[args.mode],
      model: args.model,
    };
  },
});

export const updateSandboxId = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: {
      sandboxId: string;
      branchName?: string;
      updatedAt: number;
    } = {
      sandboxId: args.sandboxId,
      updatedAt: Date.now(),
    };
    if (args.branchName) {
      updates.branchName = args.branchName;
    }
    await ctx.db.patch(args.sessionId, updates);
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    planContent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.sessionId));

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (!last) return null;

    const patch: {
      content: string;
      activityLog?: string;
      finishedAt?: number;
    } = {
      content: args.success
        ? args.result || "I couldn't process your message."
        : `Error: ${args.error || "Unknown error during execution."}`,
      finishedAt: Date.now(),
    };
    if (args.activityLog) {
      patch.activityLog = args.activityLog;
    }
    await ctx.db.patch(last._id, patch);

    const sessionPatch: {
      activeWorkflowId?: string;
      updatedAt: number;
      planContent?: string;
    } = {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    };
    if (args.planContent) {
      sessionPatch.planContent = args.planContent;
    }
    await ctx.db.patch(args.sessionId, sessionPatch);
    return null;
  },
});

export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const completionStartedAt = Date.now();
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    console.log(
      `[sessionWorkflow] handleCompletion received sessionId=${args.sessionId} success=${args.success} workflowId=${session.activeWorkflowId}`,
    );

    await workflow.sendEvent(ctx, {
      ...sessionCompleteEvent,
      workflowId: session.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "session",
      entityId: String(args.sessionId),
      entityTitle: session.title,
      rawResultEvent: args.rawResultEvent,
      repoId: session.repoId,
      createdAt: Date.now(),
    });

    console.log(
      `[sessionWorkflow] handleCompletion finished in ${Date.now() - completionStartedAt}ms sessionId=${args.sessionId}`,
    );

    return null;
  },
});

export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: v.string(),
    responseLength: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    if (
      args.mode !== "ask" &&
      args.mode !== "plan" &&
      args.mode !== "execute"
    ) {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        mode: args.mode,
        model: args.model,
        responseLength: args.responseLength,
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleSession,
      { sessionId: args.sessionId, workflowId: String(workflowId) },
    );

    return null;
  },
});

export const cancelExecution = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    if (session.activeWorkflowId) {
      await workflow.cancel(ctx, session.activeWorkflowId as WorkflowId);
    }

    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (last && last.role === "assistant") {
      const patch: {
        content?: string;
        activityLog?: string;
        finishedAt: number;
      } = {
        finishedAt: Date.now(),
      };
      if (!last.content) {
        patch.content = "Execution cancelled by user.";
      }
      if (streaming?.currentActivity) {
        patch.activityLog = streaming.currentActivity;
      }
      await ctx.db.patch(last._id, patch);
    }

    await clearStreamingActivity(ctx, String(args.sessionId));

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});
