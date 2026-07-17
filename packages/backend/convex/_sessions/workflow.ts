import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { ensureSandboxStartedSteps } from "../_daytona/resumeSandboxSteps";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  reasoningLevelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
  sessionStatusValidator,
} from "../validators";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
} from "../_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { resolveMessageTokens } from "../_mentions/resolveMessageTokens";
import { buildCustomInstructionsBlock } from "../prompts";
import {
  buildPlanPrompt,
  buildEditPrompt,
  buildConversationalPrompt,
} from "./prompts";
import { classifyTurnKind, type SessionTurnKind } from "./turnKind";
import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// --- Completion event ---

export const sessionCompleteEvent = defineEvent({
  name: "sessionComplete",
  validator: workflowCompleteValidator,
});

// --- Mode config ---

export const MODE_TOOLS: Record<"edit" | "plan", string> = {
  edit: "Read,Write,Edit,Bash,Glob,Grep",
  plan: "Read,Write,Glob,Grep",
};

const WORKSPACE_DIR = "/tmp/repo";
const LEGACY_WORKSPACE_DIR = "/workspace/repo";

// Accepts legacy "ask"/"execute" for in-flight queued messages — treated as "edit" in handlers
export const sessionModeArgValidator = v.union(
  v.literal("edit"),
  v.literal("ask"),
  v.literal("execute"),
  v.literal("plan"),
);

/**
 * Builds the mode-specific agent prompt for a session turn (doc `@` mentions
 * resolved, custom instructions + system prompt folded in). Shared single
 * source of truth so both the workflow's `getSessionData` query and the
 * daemon-pull `startExecute` mutation produce byte-identical prompts — the
 * daemon must run exactly what the workflow would have handed it, never a
 * second variant. Takes already-fetched session/repo/user docs so it works from
 * either a query or a mutation context (MutationCtx satisfies QueryCtx for the
 * read-only mention resolution).
 */
export async function buildSessionPrompt(
  ctx: QueryCtx,
  args: {
    session: Doc<"sessions">;
    repo: Doc<"githubRepos">;
    user: Doc<"users"> | null;
    message: string;
    mode: "edit" | "ask" | "execute" | "plan";
  },
): Promise<{ prompt: string; branchName: string; turnKind: SessionTurnKind }> {
  const { session, repo, user } = args;
  const rootDirectory = repo.rootDirectory ?? "";
  const customInstructionsBlock = buildCustomInstructionsBlock(
    user?.role ?? undefined,
    user?.customInstructions ?? undefined,
  );

  const effectiveMode: "edit" | "plan" = args.mode === "plan" ? "plan" : "edit";
  const branchName = session.branchName || `eva/session-${session._id}`;

  const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
    ctx,
    args.message,
    session.repoId,
  );

  const turnKind: SessionTurnKind =
    effectiveMode === "plan" ? "agent" : classifyTurnKind(resolvedMessage);

  let prompt: string;
  if (effectiveMode === "plan") {
    prompt = buildPlanPrompt(
      { owner: repo.owner, name: repo.name },
      session.planContent || "",
      resolvedMessage,
      rootDirectory,
      customInstructionsBlock,
      repo.systemPrompt,
    );
  } else if (turnKind === "conversational") {
    prompt = buildConversationalPrompt(
      resolvedMessage,
      customInstructionsBlock,
      repo.systemPrompt,
    );
  } else {
    prompt = buildEditPrompt(
      { owner: repo.owner, name: repo.name },
      branchName,
      session.planContent || "",
      resolvedMessage,
      rootDirectory,
      customInstructionsBlock,
      repo.systemPrompt,
      session.captureProofEnabled === true,
    );
  }
  if (prefixBlock) {
    prompt = `${prefixBlock}\n\n${prompt}`;
  }
  return { prompt, branchName, turnKind };
}

// --- Workflows ---

/** Starts a session sandbox (clone + branch setup) as a durable workflow step. */
export const sessionSandboxStartupWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    // Daytona-only pre-thaw: archived restores can exceed the 10-minute action
    // limit, so poll across workflow steps first. Vercel resume is handled
    // inside startSessionSandbox → ensureSandboxRunning; running kickoff here
    // only added ~6–8s of workflow step-scheduling latency (measured).
    if (args.existingSandboxId && !args.vercelSandboxId) {
      try {
        await ensureSandboxStartedSteps(step, {
          sandboxId: args.existingSandboxId,
          vercelSandboxId: args.vercelSandboxId,
          repoId: args.repoId,
          // Must match SessionDetailClient + startSandbox seed entity.
          streamingEntityId: `session-startup-${args.sessionId}`,
        });
      } catch (error) {
        await step.runMutation(internal.sessions.sandboxError, {
          sessionId: args.sessionId,
          error:
            error instanceof Error
              ? error.message
              : "Sandbox could not be restored from cold storage. Please retry.",
        });
        return;
      }
    }
    await step.runAction(internal.daytona.startSessionSandbox, {
      sessionId: args.sessionId,
      existingSandboxId: args.existingSandboxId,
      vercelSandboxId: args.vercelSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });
  },
});

/** Runs a session message through the sandbox agent in the specified mode (ask/plan/execute). */
export const sessionExecuteWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
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
      userId: args.userId,
    });

    // Daemon-pull dispatch: the prompt is NOT pushed from here. `startExecute`
    // has already staged it in `session.pendingTurn` and scheduled a daemon to
    // claim it; the warm daemon pulls it via `claimPendingTurn` in ~one poll,
    // which is why we no longer probe/handoff/launch WITH a prompt here (doing
    // so would double-execute the turn). This workflow's remaining job is to
    // (a) make sure the sandbox is started (thawing cold/archived storage over
    // durable steps) and a daemon is alive to do the claim, then (b) awaitEvent
    // + run the unchanged post-turn bookkeeping (branch push, saveResult,
    // deployment tracking).
    let sandboxId: string | null = null;
    let validatedSandboxId: string | null = null;

    if (data.sandboxId || data.vercelSandboxId) {
      // Bring an archived/stopped sandbox back to "started" via durable polling
      // steps first, so a multi-minute cold-storage thaw doesn't blow the
      // per-action 10-minute limit inside validateSandbox. Once started, the
      // validate below hits its fast (echo) path.
      let started: Awaited<ReturnType<typeof ensureSandboxStartedSteps>>;
      try {
        started = await ensureSandboxStartedSteps(step, {
          sandboxId: data.sandboxId,
          vercelSandboxId: data.vercelSandboxId,
          repoId: data.repoId,
          streamingEntityId: args.sessionId,
          sandboxRunning: data.status === "active",
        });
      } catch (error) {
        await step.runMutation(internal.sessionWorkflow.saveResult, {
          sessionId: args.sessionId,
          success: false,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : "Sandbox could not be restored from cold storage. Please retry.",
          activityLog: null,
        });
        return;
      }

      const thawId = started.thawId;
      if (thawId) {
        const validation = await step.runAction(
          internal.daytona.validateSandbox,
          { sandboxId: thawId, repoId: data.repoId },
          { retry: false },
        );
        validatedSandboxId = validation.healthy ? thawId : null;
      }
    }

    if (validatedSandboxId) {
      sandboxId = validatedSandboxId;
    } else {
      const prepared = await step.runAction(
        internal.daytona.prepareSessionSandbox,
        {
          sessionId: args.sessionId,
          existingSandboxId: data.sandboxId,
          vercelSandboxId: data.vercelSandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName ?? `eva/session-${args.sessionId}`,
          baseBranch: data.baseBranch,
          repoId: data.repoId,
          startDesktop: false,
        },
        { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = prepared.sandboxId;

      await step.runMutation(internal.sessionWorkflow.updateSandboxId, {
        sessionId: args.sessionId,
        sandboxId,
        vercelSandboxId: prepared.vercelSandboxId,
        branchName: data.branchName,
      });
    }

    if (sandboxId === null) {
      // Unreachable: sandboxId is assigned on both branches above.
      throw new Error("sessionExecuteWorkflow: sandbox was not resolved");
    }

    // Ensure a daemon is alive to claim the staged prompt. Idempotent and
    // prompt-less: a no-op if a daemon is already warm (the common warm-turn
    // case, and it never pkills a live daemon), otherwise it respawns one in
    // pull mode. `startExecute` already scheduled this same action; running it
    // again here covers the cold/archived path where the sandbox was only just
    // started by the steps above (so the earlier schedule found nothing to
    // start) and guards against a daemon that died between turns.
    await step.runAction(internal.daytona.prewarmSessionDaemon, {
      sandboxId,
      sessionId: args.sessionId,
      repoId: data.repoId,
      userId: args.userId,
      model: data.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      allowedTools: data.allowedTools,
      providerAccountId: args.providerAccountId,
      sessionPersistenceId: args.sessionId,
    });

    // Cancel can race with startExecute and wipe the newly staged pendingTurn
    // while this workflow keeps waiting. Re-stage from workflow args whenever
    // the turn is still open and nothing is pending for the daemon to claim.
    await step.runMutation(internal.sessionWorkflow.ensurePendingTurn, {
      sessionId: args.sessionId,
      prompt: data.prompt,
      turnKind: data.turnKind,
      attachmentStorageIds: data.attachmentStorageIds,
      model: args.model,
    });

    const result = await step.awaitEvent(sessionCompleteEvent);

    let planContent: string | undefined;

    if (args.mode === "plan" && result.success && sandboxId) {
      const planRaw = await step.runAction(internal.daytona.runSandboxCommand, {
        sandboxId,
        command: `cat ${WORKSPACE_DIR}/plan.md 2>/dev/null || cat ${LEGACY_WORKSPACE_DIR}/plan.md 2>/dev/null || echo ""`,
        timeoutSeconds: 10,
        repoId: data.repoId,
      });
      if (planRaw.trim()) {
        planContent = planRaw.trim();
      }
    }

    // Persist the assistant reply BEFORE publish. A hung/slow git push used to
    // leave the UI on "Working…" forever even after the daemon had completed —
    // streamed tokens may also be empty for short conversational-ish agent
    // turns. Publish failures are patched onto the saved message below.
    await step.runMutation(internal.sessionWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
      planContent,
      pendingQuestion: result.pendingQuestion,
    });

    // Eva owns publishing: the agent commits inside the sandbox but never
    // pushes (see prompts.ts). Always push after a successful AGENT turn —
    // matching project/task chat. Do NOT gate on `git status --porcelain`:
    // after a proper commit the tree is clean, so that check skipped every
    // publish and left commits stranded in the sandbox.
    let pushSucceeded = false;
    if (
      args.mode !== "plan" &&
      result.success &&
      data.branchName &&
      data.turnKind === "agent"
    ) {
      try {
        await step.runAction(internal.daytona.pushSandboxBranch, {
          sandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
        });
        pushSucceeded = true;
      } catch (error) {
        const publishError = `Session completed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
        console.error(
          `[sessionWorkflow] pushSandboxBranch failed sessionId=${args.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        await step.runMutation(internal.sessionWorkflow.saveResult, {
          sessionId: args.sessionId,
          success: false,
          result: result.result,
          error: publishError,
          activityLog: result.activityLog,
          planContent,
          pendingQuestion: result.pendingQuestion,
        });
      }
    }

    if (pushSucceeded) {
      await step.runMutation(
        internal.sessionWorkflow.scheduleSessionDeploymentTracking,
        {
          sessionId: args.sessionId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
          deploymentProjectName: data.deploymentProjectName,
        },
      );

      // Open a draft PR after the first successful push (no-op if one exists
      // on the session or on GitHub for this branch, or if not ahead of base).
      // Retried on later turns so a transient GitHub failure self-heals.
      try {
        await step.runAction(internal.github.createDraftSessionPr, {
          sessionId: args.sessionId,
        });
      } catch (error) {
        const errorDetail =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[sessionWorkflow] createDraftSessionPr failed sessionId=${args.sessionId}: ${errorDetail}`,
        );
        await step.runMutation(internal.sessionWorkflow.postSystemAlert, {
          sessionId: args.sessionId,
          content: "Failed to create draft PR",
          errorDetail,
        });
      }
    }

    // Fire an audit after a successful agent turn when "Run audit" is on for
    // the session. maybeStartTurnAudit is idempotent and no-ops when the toggle
    // is off / no sandbox / no categories / an audit is already running. The
    // audit runs detached (scheduled action) so the workflow completes now;
    // wrapped so an audit failure never fails the turn. turnKind comes from the
    // step-recorded query — deterministic on replay.
    if (args.mode !== "plan" && result.success && data.turnKind === "agent") {
      try {
        await step.runMutation(internal.audits.maybeStartTurnAudit, {
          sessionId: args.sessionId,
          userId: args.userId,
        });
      } catch (error) {
        console.error(
          `[sessionWorkflow] maybeStartTurnAudit failed sessionId=${args.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  },
});

// --- Deployment tracking ---

/** Queues deployment status polling for a session branch after a successful execute. */
export const scheduleSessionDeploymentTracking = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    branchName: v.string(),
    deploymentProjectName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { deploymentStatus: "queued" });
    await ctx.scheduler.runAfter(
      30_000,
      internal.taskWorkflowActions.pollSessionDeploymentStatus,
      {
        sessionId: args.sessionId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        repoId: args.repoId,
        branchName: args.branchName,
        deploymentProjectName: args.deploymentProjectName,
        attempt: 0,
      },
    );
    return null;
  },
});

// --- Supporting internal functions ---

/** Posts a non-streaming system alert into the session chat (e.g. draft PR failure). */
export const postSystemAlert = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    errorDetail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: args.content,
      timestamp: Date.now(),
      isSystemAlert: true,
      ...(args.errorDetail !== undefined && { errorDetail: args.errorDetail }),
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return null;
  },
});

/** Clears stuck empty Working bubbles + leftover streaming for a session. */
export const clearStuckWorkingState = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.object({
    deletedPlaceholders: v.number(),
    clearedStreaming: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .collect();
    let deletedPlaceholders = 0;
    for (const message of messages) {
      if (
        message.role === "assistant" &&
        message.isSystemAlert !== true &&
        message.content === "" &&
        message.finishedAt === undefined
      ) {
        await ctx.db.delete(message._id);
        deletedPlaceholders += 1;
      }
    }
    await clearStreamingActivity(ctx, String(args.sessionId));
    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      pendingTurn: undefined,
      updatedAt: Date.now(),
    });
    return { deletedPlaceholders, clearedStreaming: true };
  },
});

/**
 * Inserts an empty assistant message into the session for streaming updates.
 * Idempotent: the daemon-pull `startExecute` already inserts this placeholder
 * before starting the workflow, so if the last message is already an empty
 * assistant placeholder we skip, avoiding a duplicate.
 */
export const addAssistantPlaceholder = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mode: sessionModeArgValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const recent = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .take(10);
    // Ignore system alerts (e.g. draft-PR failures) sitting on top — startExecute
    // may already have staged an empty placeholder underneath them.
    const lastTurnMessage = recent.find(
      (message) => message.isSystemAlert !== true,
    );
    if (
      lastTurnMessage &&
      lastTurnMessage.role === "assistant" &&
      lastTurnMessage.content === "" &&
      lastTurnMessage.finishedAt === undefined
    ) {
      return null;
    }

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

/** Fetches session and repo data, builds the mode-specific prompt, and resolves branch/tools config. */
export const getSessionData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: aiModelValidator,
    userId: v.id("users"),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
    status: sessionStatusValidator,
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.string(),
    allowedTools: v.string(),
    model: aiModelValidator,
    deploymentProjectName: v.optional(v.string()),
    turnKind: v.union(v.literal("conversational"), v.literal("agent")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const effectiveMode: "edit" | "plan" =
      args.mode === "plan" ? "plan" : "edit";

    const user = await ctx.db.get(args.userId);
    const { prompt, branchName, turnKind } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: args.message,
      mode: args.mode,
    });

    // Input images attached to the triggering user message. Used to re-stage
    // pendingTurn on the queued/cancel-race path (immediate sends stage them
    // directly in startExecute).
    const triggeringUserMessage = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .filter((q) => q.eq(q.field("role"), "user"))
      .first();

    return {
      sandboxId: session.sandboxId,
      vercelSandboxId: session.vercelSandboxId,
      status: session.status,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      turnKind,
      baseBranch: repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
      allowedTools: MODE_TOOLS[effectiveMode],
      model: normalizeAIModel(args.model),
      deploymentProjectName: repo.deploymentProjectName,
      attachmentStorageIds: triggeringUserMessage?.attachmentStorageIds,
    };
  },
});

/** Updates the session's sandbox ID and optionally its branch name after sandbox preparation. */
export const updateSandboxId = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    vercelSandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: {
      sandboxId: string;
      vercelSandboxId?: string;
      branchName?: string;
      updatedAt: number;
    } = {
      sandboxId: args.sandboxId,
      updatedAt: Date.now(),
    };
    if (args.vercelSandboxId !== undefined) {
      updates.vercelSandboxId = args.vercelSandboxId;
    }
    if (args.branchName) {
      updates.branchName = args.branchName;
    }
    await ctx.db.patch(args.sessionId, updates);
    return null;
  },
});

/** Saves the session execution result, updating the last message and starting queued messages. */
export const saveResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    planContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.sessionId));

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const recent = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .take(20);
    // Never overwrite system alerts (e.g. draft-PR failures posted after a
    // prior turn) — those sit as the latest assistant row and would steal the
    // next saveResult, leaving errorDetail on the real reply.
    const last = recent.find(
      (message) =>
        message.role === "assistant" && message.isSystemAlert !== true,
    );
    if (!last) return null;

    const publishFailedAfterResult =
      args.result !== null &&
      args.error !== null &&
      args.error.startsWith(
        "Session completed locally, but Eva could not publish",
      );
    const patch: {
      content: string;
      activityLog?: string;
      finishedAt?: number;
      pendingQuestion?: string;
      isSystemAlert?: boolean;
      errorDetail?: string;
    } = {
      content:
        args.success || publishFailedAfterResult
          ? args.result || "I couldn't process your message."
          : `Error: ${args.error || "Unknown error during execution."}`,
      finishedAt: Date.now(),
      isSystemAlert: undefined,
      errorDetail: undefined,
    };
    if (args.activityLog) {
      patch.activityLog = args.activityLog;
    }
    if (args.pendingQuestion) {
      patch.pendingQuestion = args.pendingQuestion;
    }
    await ctx.db.patch(last._id, patch);

    // Drop any orphan empty placeholders left when a system alert sat on top
    // and addAssistantPlaceholder / startExecute staged a second bubble.
    for (const message of recent) {
      if (
        message._id !== last._id &&
        message.role === "assistant" &&
        message.isSystemAlert !== true &&
        message.content === "" &&
        message.finishedAt === undefined
      ) {
        await ctx.db.delete(message._id);
      }
    }

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
    await startNextQueuedSessionMessage(ctx, args.sessionId);
    return null;
  },
});

/**
 * Daemon-pull turn claim. The warm sandbox daemon polls this every ~200ms; when
 * `startExecute` has staged a prompt in `session.pendingTurn`, this atomically
 * hands it over and clears the field so the same prompt is never claimed twice
 * (which would double-execute the turn). Returns `{ prompt: null }` when nothing
 * is pending. Public + auth-gated (via the sandbox CONVEX_TOKEN identity) to
 * match `handleCompletion` — the daemon calls it over `/api/mutation`, and
 * internal mutations are not reachable there.
 */
export const claimPendingTurn = authMutation({
  args: {
    sessionId: v.id("sessions"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    turnKind: v.union(v.literal("conversational"), v.literal("agent")),
    // Resolved download URLs for this turn's input image attachments. The daemon
    // fetches these and hands the agent local file paths before running the turn.
    attachmentUrls: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const emptyClaim = {
      prompt: null,
      turnKind: "agent",
      attachmentUrls: [],
    } satisfies { prompt: null; turnKind: SessionTurnKind; attachmentUrls: [] };
    const session = await ctx.db.get(args.sessionId);
    if (!session) return emptyClaim;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    if (!session.pendingTurn) return emptyClaim;

    const pendingModel = session.pendingTurn.model;
    if (pendingModel !== undefined) {
      const claimModel = normalizeAIModel(args.model);
      if (normalizeAIModel(pendingModel) !== claimModel) {
        console.log(
          `[sessionWorkflow] claimPendingTurn model mismatch sessionId=${args.sessionId} pending=${pendingModel} claim=${claimModel}`,
        );
        return emptyClaim;
      }
    }

    const prompt = session.pendingTurn.prompt;
    const turnKind: SessionTurnKind = session.pendingTurn.turnKind ?? "agent";
    const claimWaitMs = Date.now() - session.pendingTurn.requestedAt;
    const resolvedUrls = await Promise.all(
      (session.pendingTurn.attachmentStorageIds ?? []).map((id) =>
        ctx.storage.getUrl(id),
      ),
    );
    const attachmentUrls = resolvedUrls.filter(
      (url): url is string => url !== null,
    );
    await ctx.db.patch(args.sessionId, { pendingTurn: undefined });
    console.log(
      `[sessionWorkflow] claimPendingTurn sessionId=${args.sessionId} turnKind=${turnKind} claimWaitMs=${claimWaitMs} attachments=${attachmentUrls.length}`,
    );
    return { prompt, turnKind, attachmentUrls };
  },
});

/**
 * Re-stages `pendingTurn` when a cancel raced with startExecute and wiped the
 * prompt while the workflow is still waiting on sessionComplete. No-op when a
 * turn is already pending or the latest assistant message already finished.
 */
export const ensurePendingTurn = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    prompt: v.string(),
    turnKind: v.union(v.literal("conversational"), v.literal("agent")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.pendingTurn) return null;

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (!last || last.role !== "assistant" || last.finishedAt !== undefined) {
      return null;
    }

    await ctx.db.patch(args.sessionId, {
      pendingTurn: {
        prompt: args.prompt,
        requestedAt: Date.now(),
        turnKind: args.turnKind,
        attachmentStorageIds: args.attachmentStorageIds,
        ...(args.model !== undefined
          ? { model: normalizeAIModel(args.model) }
          : {}),
      },
      updatedAt: Date.now(),
    });
    console.log(
      `[sessionWorkflow] ensurePendingTurn restaged sessionId=${args.sessionId} turnKind=${args.turnKind}`,
    );
    return null;
  },
});

/**
 * Ops/recovery: rebuild and stage pendingTurn for a session stuck on an open
 * assistant placeholder (daemon polling empty after a cancel race).
 */
export const restageOpenTurn = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({ restaged: v.literal(true), turnKind: v.string() }),
    v.object({ restaged: v.literal(false), reason: v.string() }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session)
      return { restaged: false as const, reason: "session not found" };
    if (session.pendingTurn)
      return { restaged: false as const, reason: "pendingTurn already set" };

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .take(5);
    const lastAssistant = messages.find((m) => m.role === "assistant");
    if (
      !lastAssistant ||
      lastAssistant.finishedAt !== undefined ||
      lastAssistant.content !== ""
    ) {
      return {
        restaged: false as const,
        reason: "no open empty assistant placeholder",
      };
    }
    const lastUser = messages.find((m) => m.role === "user");
    if (
      !lastUser ||
      typeof lastUser.content !== "string" ||
      !lastUser.content
    ) {
      return {
        restaged: false as const,
        reason: "no user message to restage",
      };
    }

    const repo = await ctx.db.get(session.repoId);
    if (!repo) return { restaged: false as const, reason: "repo not found" };
    const user = await ctx.db.get(session.userId);
    const rawMode = lastAssistant.mode ?? lastUser.mode ?? "edit";
    const mode: "edit" | "ask" | "execute" | "plan" =
      rawMode === "plan" ||
      rawMode === "ask" ||
      rawMode === "execute" ||
      rawMode === "edit"
        ? rawMode
        : "edit";
    const { prompt, turnKind } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: lastUser.content,
      mode,
    });

    await ctx.db.patch(args.sessionId, {
      pendingTurn: {
        prompt,
        requestedAt: Date.now(),
        turnKind,
        attachmentStorageIds: lastUser.attachmentStorageIds,
        ...(session.lastModel !== undefined
          ? { model: session.lastModel }
          : {}),
      },
      updatedAt: Date.now(),
    });
    console.log(
      `[sessionWorkflow] restageOpenTurn sessionId=${args.sessionId} turnKind=${turnKind}`,
    );
    return { restaged: true as const, turnKind };
  },
});

/** Receives sandbox completion callback and forwards the event to the active session workflow. */
export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
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

    await sendCompletionEvent(
      ctx,
      sessionCompleteEvent,
      session.activeWorkflowId,
      {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    );

    await recordCompletionLog(ctx, {
      entityType: "session",
      entityId: String(args.sessionId),
      entityTitle: session.title,
      repoId: session.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    console.log(
      `[sessionWorkflow] handleCompletion finished in ${Date.now() - completionStartedAt}ms sessionId=${args.sessionId}`,
    );

    return null;
  },
});
