import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { ensureSandboxStartedSteps } from "../_sandbox_runtime/resumeSandboxSteps";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  reasoningLevelValidator,
  workflowCompleteValidator,
  getAIModelProvider,
  normalizeAIModel,
  sessionStatusValidator,
} from "../validators";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
  extractFirstJsonValue,
} from "../_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { resolveMessageTokens } from "../_mentions/resolveMessageTokens";
import { buildCustomInstructionsBlock } from "../prompts";
import { buildPlanPrompt, buildEditPrompt, buildDesignPrompt } from "./prompts";
import { z } from "zod";
import { orphanPlaceholderMessages, resultTargetMessage } from "./resultTarget";
import { isUnclaimedOpenTurn } from "./pendingTurnRecovery";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { finalizeCancelledAssistantMessage } from "../streaming";
import { backgroundAgentEntryValidator } from "../_validators/tableFields";
import { mergeBackgroundAgents } from "./backgroundAgents";

// --- Completion event ---

export const sessionCompleteEvent = defineEvent({
  name: "sessionComplete",
  validator: workflowCompleteValidator,
});

// --- Mode config ---

export const MODE_TOOLS: Record<"edit" | "plan" | "design", string> = {
  edit: "Read,Write,Edit,Bash,Glob,Grep",
  plan: "Read,Write,Glob,Grep",
  design: "Read,Glob,Grep,Skill,Write,Edit,Bash",
};

type SessionPromptMode = "edit" | "ask" | "execute" | "plan" | "design";

/** Maps a session turn mode to the MODE_TOOLS key used for allowedTools. */
export function resolveToolMode(
  mode: SessionPromptMode,
): keyof typeof MODE_TOOLS {
  if (mode === "plan") return "plan";
  if (mode === "design") return "design";
  return "edit";
}

const designResultSchema = z.object({
  summary: z.string().optional(),
  variations: z
    .array(
      z.object({
        label: z.string(),
        route: z.string().optional(),
        filePath: z.string().optional(),
      }),
    )
    .optional(),
});

/** Parses design-turn JSON output from agent text. */
function parseDesignResult(
  text: string | null,
): z.infer<typeof designResultSchema> | null {
  if (!text) return null;
  const raw = extractFirstJsonValue(text);
  const parsed = designResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const WORKSPACE_DIR = "/tmp/repo";
const LEGACY_WORKSPACE_DIR = "/workspace/repo";

/** Finalizes and clears an open synthetic-turn placeholder on session hygiene paths. */
async function finalizeOpenSyntheticTurn(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  syntheticTurnMessageId: Id<"messages"> | undefined,
): Promise<void> {
  if (syntheticTurnMessageId === undefined) return;
  const syntheticMessage = await ctx.db.get(syntheticTurnMessageId);
  if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(sessionId)))
      .first();
    await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
  }
  await ctx.db.patch(sessionId, { syntheticTurnMessageId: undefined });
}

// Accepts legacy "ask"/"execute" for in-flight queued messages — treated as "edit" in handlers
export const sessionModeArgValidator = v.union(
  v.literal("edit"),
  v.literal("ask"),
  v.literal("execute"),
  v.literal("plan"),
  v.literal("design"),
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
    mode: SessionPromptMode;
    personaId?: Id<"designPersonas">;
    numDesigns?: number;
  },
): Promise<{ prompt: string; branchName: string }> {
  const { session, repo, user } = args;
  const rootDirectory = repo.rootDirectory ?? "";
  const customInstructionsBlock = buildCustomInstructionsBlock(
    user?.role ?? undefined,
    user?.customInstructions ?? undefined,
  );

  const branchName = session.branchName || `eva/session-${session._id}`;

  const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
    ctx,
    args.message,
    session.repoId,
  );

  let prompt: string;
  if (args.mode === "plan") {
    prompt = buildPlanPrompt(
      { owner: repo.owner, name: repo.name },
      session.planContent || "",
      resolvedMessage,
      rootDirectory,
      customInstructionsBlock,
      repo.systemPrompt,
    );
  } else if (args.mode === "design") {
    let persona: { name: string; prompt: string } | null = null;
    if (args.personaId) {
      const personaDoc = await ctx.db.get(args.personaId);
      if (personaDoc) {
        persona = { name: personaDoc.name, prompt: personaDoc.prompt };
      }
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", session._id))
      .collect();

    let selectedBase: { label: string; filePath: string } | null = null;
    if (session.selectedVariationIndex !== undefined) {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.variations?.length);
      if (lastAssistant?.variations) {
        const variation =
          lastAssistant.variations[session.selectedVariationIndex];
        if (variation?.filePath) {
          selectedBase = {
            label: variation.label,
            filePath: variation.filePath,
          };
        }
      }
    }

    const conversationHistory = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    prompt = buildDesignPrompt(
      { owner: repo.owner, name: repo.name },
      resolvedMessage,
      conversationHistory,
      selectedBase,
      persona,
      rootDirectory,
      args.numDesigns ?? 3,
      customInstructionsBlock,
    );
  } else {
    prompt = buildEditPrompt(
      {
        owner: repo.owner,
        name: repo.name,
        baseBranch: session.baseBranch ?? repo.defaultBaseBranch,
      },
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
  return { prompt, branchName };
}

// --- Workflows ---

/** Starts a session sandbox (clone + branch setup) as a durable workflow step. */
export const sessionSandboxStartupWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runAction(internal.sandbox.startSessionSandbox, {
      sessionId: args.sessionId,
      existingSandboxId: args.existingSandboxId,
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
    credentialOwnerUserId: v.optional(v.id("users")),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
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
      personaId: args.personaId,
      numDesigns: args.numDesigns,
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

    if (data.sandboxId) {
      // Bring an archived/stopped sandbox back to "started" via durable polling
      // steps first, so a multi-minute cold-storage thaw doesn't blow the
      // per-action 10-minute limit inside validateSandbox. Once started, the
      // validate below hits its fast (echo) path.
      let started: Awaited<ReturnType<typeof ensureSandboxStartedSteps>>;
      try {
        started = await ensureSandboxStartedSteps(step, {
          sandboxId: data.sandboxId,
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
          internal.sandbox.validateSandbox,
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
        internal.sandbox.prepareSessionSandbox,
        {
          sessionId: args.sessionId,
          existingSandboxId: data.sandboxId,
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
        branchName: data.branchName,
      });
    }

    if (sandboxId === null) {
      // Unreachable: sandboxId is assigned on both branches above.
      throw new Error("sessionExecuteWorkflow: sandbox was not resolved");
    }

    // Claude only: cancel can race with startExecute and wipe pendingTurn while
    // this workflow waits. One-shot providers never use claimPendingTurn.
    if (getAIModelProvider(data.model) === "claude") {
      await step.runMutation(internal.sessionWorkflow.ensurePendingTurn, {
        sessionId: args.sessionId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: args.model,
      });
    }

    // Claude sessions use the sdk-daemon pull path (prewarm + claimPendingTurn).
    // Cursor/Codex/Opencode have no pull daemon — push the prompt via one-shot
    // launch, otherwise a Cursor prewarm would run with an empty prompt and die
    // as "no parseable stream-json events within 90000ms".
    if (getAIModelProvider(data.model) === "claude") {
      await step.runAction(internal.sandbox.prewarmSessionDaemon, {
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
        credentialOwnerUserId: args.credentialOwnerUserId,
        sessionPersistenceId: args.sessionId,
      });
    } else {
      await step.runAction(internal.sandbox.launchOnExistingSandbox, {
        sandboxId,
        entityId: String(args.sessionId),
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "sessionWorkflow:handleCompletion",
        entityIdField: "sessionId",
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        allowedTools: data.allowedTools,
        repoId: data.repoId,
        streamingEntityId: String(args.sessionId),
        sessionPersistenceId: args.sessionId,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        attachmentStorageIds: data.attachmentStorageIds,
      });
    }

    const result = await step.awaitEvent(sessionCompleteEvent);

    let planContent: string | undefined;

    if (args.mode === "plan" && result.success && sandboxId) {
      const planRaw = await step.runAction(internal.sandbox.runSandboxCommand, {
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
    if (args.mode !== "plan" && result.success && data.branchName) {
      try {
        await step.runAction(internal.sandbox.pushSandboxBranch, {
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
        const sessionPrUrl = await step.runAction(
          internal.github.createDraftSessionPr,
          {
            sessionId: args.sessionId,
          },
        );
        if (sessionPrUrl) {
          try {
            await step.runMutation(
              internal._prRecapWorkflow.evaTrigger.scheduleEvaPrRecap,
              {
                repoId: data.repoId,
                userId: args.userId,
                prUrl: sessionPrUrl,
              },
            );
          } catch (recapError) {
            console.error(
              `[sessionWorkflow] scheduleEvaPrRecap failed sessionId=${args.sessionId}: ${recapError instanceof Error ? recapError.message : String(recapError)}`,
            );
          }
        }
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
    // wrapped so an audit failure never fails the turn.
    if (args.mode !== "plan" && result.success) {
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
    const session = await ctx.db.get(args.sessionId);
    if (session?.syntheticTurnMessageId) {
      await finalizeOpenSyntheticTurn(
        ctx,
        args.sessionId,
        session.syntheticTurnMessageId,
      );
    }
    await clearStreamingActivity(ctx, String(args.sessionId));
    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      pendingTurn: undefined,
      syntheticTurnMessageId: undefined,
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
      lastTurnMessage.finishedAt === undefined &&
      lastTurnMessage.isSyntheticTurn !== true
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
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
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
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const user = await ctx.db.get(args.userId);
    const { prompt, branchName } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: args.message,
      mode: args.mode,
      personaId: args.personaId,
      numDesigns: args.numDesigns,
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
      status: session.status,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      baseBranch:
        session.baseBranch ??
        repo.defaultBaseBranch ??
        FALLBACK_GIT_BASE_BRANCH,
      allowedTools: MODE_TOOLS[resolveToolMode(args.mode)],
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
    const last = resultTargetMessage(recent);
    if (!last) return null;

    const publishFailedAfterResult =
      args.result !== null &&
      args.error !== null &&
      args.error.startsWith(
        "Session completed locally, but Eva could not publish",
      );

    const isDesignTurn = last.mode === "design";
    const designParsed =
      isDesignTurn && args.success ? parseDesignResult(args.result) : null;

    const patch: {
      content: string;
      activityLog?: string;
      finishedAt?: number;
      pendingQuestion?: string;
      isSystemAlert?: boolean;
      errorDetail?: string;
      variations?: Array<{
        label: string;
        route?: string;
        filePath?: string;
      }>;
    } = {
      content:
        designParsed !== null
          ? designParsed.summary || "Here are the design variations:"
          : args.success || publishFailedAfterResult
            ? args.result || "I couldn't process your message."
            : `Error: ${args.error || "Unknown error during execution."}`,
      finishedAt: Date.now(),
      isSystemAlert: undefined,
      errorDetail: undefined,
    };
    if (designParsed?.variations) {
      patch.variations = designParsed.variations.map((variation) => ({
        label: variation.label,
        route: variation.route,
        filePath: variation.filePath,
      }));
    } else if (
      isDesignTurn &&
      args.success &&
      args.result &&
      designParsed === null
    ) {
      patch.content = args.result || "Failed to generate designs.";
    }
    if (args.activityLog) {
      patch.activityLog = args.activityLog;
    }
    if (args.pendingQuestion) {
      patch.pendingQuestion = args.pendingQuestion;
    }
    await ctx.db.patch(last._id, patch);

    // Drop any orphan empty placeholders left when a system alert sat on top
    // and addAssistantPlaceholder / startExecute staged a second bubble.
    for (const message of orphanPlaceholderMessages(recent, last)) {
      await ctx.db.delete(message._id);
    }

    const sessionPatch: {
      activeWorkflowId?: string;
      updatedAt: number;
      planContent?: string;
      agentBrowsingAt?: undefined;
    } = {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
      // Crash hygiene: drop stale soft-lock if the agent forgot browser_unlock.
      agentBrowsingAt: undefined,
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
 * Daemon-pull turn claim. The warm sandbox daemon polls this every ~50ms; when
 * `startExecute` has staged a prompt in `session.pendingTurn`, this atomically
 * hands it over and clears the field so the same prompt is never claimed twice
 * (which would double-execute the turn). Returns `{ prompt: null }` when nothing
 * is pending. Also doubles as the interrupt-cancel channel: `cancelRequested`
 * drains unconditionally (even mid-turn, with no pendingTurn) so a Claude
 * daemon polling during an active turn learns to abort it. Public + auth-gated
 * (via the sandbox CONVEX_TOKEN identity) to match `handleCompletion` — the
 * daemon calls it over `/api/mutation`, and internal mutations are not
 * reachable there.
 */
export const claimPendingTurn = authMutation({
  args: {
    sessionId: v.id("sessions"),
    model: v.optional(aiModelValidator),
  },
  returns: v.object({
    prompt: v.union(v.string(), v.null()),
    // Resolved download URLs for this turn's input image attachments. The daemon
    // fetches these and hands the agent local file paths before running the turn.
    attachmentUrls: v.array(v.string()),
    stopTaskToolUseIds: v.array(v.string()),
    cancelRequested: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const emptyClaim = {
      prompt: null,
      attachmentUrls: [],
      stopTaskToolUseIds: [],
      cancelRequested: false,
    } satisfies {
      prompt: null;
      attachmentUrls: string[];
      stopTaskToolUseIds: string[];
      cancelRequested: boolean;
    };
    const session = await ctx.db.get(args.sessionId);
    if (!session) return emptyClaim;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    // Withhold the turn while a new session's sandbox is still pulling the
    // latest base branch and reinstalling drifted deps (flag set at early-ready,
    // cleared when setup finishes). Returning an empty claim leaves pendingTurn
    // intact; the daemon keeps polling (45m idle budget) and claims the moment
    // the gate clears, so the agent never executes against a stale checkout.
    if (session.sandboxSetupPending === true) {
      return emptyClaim;
    }

    const stopTaskToolUseIds = session.pendingTaskStops ?? [];
    if (stopTaskToolUseIds.length > 0) {
      await ctx.db.patch(args.sessionId, { pendingTaskStops: undefined });
    }

    // Cancel must drain the same way as stopTaskToolUseIds above: the daemon
    // polls this mutation continuously, including mid-turn, specifically to
    // notice an interrupt — gating the drain on pendingTurn would strand it.
    const cancelRequested = session.cancelRequestedAt !== undefined;
    if (cancelRequested) {
      await ctx.db.patch(args.sessionId, { cancelRequestedAt: undefined });
    }

    if (!session.pendingTurn) {
      return { ...emptyClaim, stopTaskToolUseIds, cancelRequested };
    }

    const pendingModel = session.pendingTurn.model;
    if (pendingModel !== undefined) {
      const claimModel = normalizeAIModel(args.model);
      if (normalizeAIModel(pendingModel) !== claimModel) {
        console.log(
          `[sessionWorkflow] claimPendingTurn model mismatch sessionId=${args.sessionId} pending=${pendingModel} claim=${claimModel}`,
        );
        return { ...emptyClaim, stopTaskToolUseIds, cancelRequested };
      }
    }

    const prompt = session.pendingTurn.prompt;
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
      `[sessionWorkflow] claimPendingTurn sessionId=${args.sessionId} claimWaitMs=${claimWaitMs} attachments=${attachmentUrls.length}`,
    );
    return { prompt, attachmentUrls, stopTaskToolUseIds, cancelRequested };
  },
});

/** Daemon patches background Agent/Task lifecycle entries (start/settle only). */
export const updateBackgroundAgents = authMutation({
  args: {
    sessionId: v.id("sessions"),
    agents: v.array(backgroundAgentEntryValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");
    if (args.agents.length === 0) return null;

    await ctx.db.patch(args.sessionId, {
      backgroundAgents: mergeBackgroundAgents(
        session.backgroundAgents,
        args.agents,
      ),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** User-facing stop request for a background agent; drained via claimPendingTurn. */
export const requestStopBackgroundAgent = authMutation({
  args: {
    sessionId: v.id("sessions"),
    toolUseId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const pending = session.pendingTaskStops ?? [];
    if (pending.includes(args.toolUseId)) return null;

    await ctx.db.patch(args.sessionId, {
      pendingTaskStops: [...pending, args.toolUseId],
      updatedAt: Date.now(),
    });
    return null;
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
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    model: v.optional(aiModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    // One-shot providers push the prompt; restaging would only spam a leftover
    // Claude daemon with claimPendingTurn model-mismatch logs.
    if (
      args.model !== undefined &&
      getAIModelProvider(normalizeAIModel(args.model)) !== "claude"
    ) {
      return null;
    }

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (
      !isUnclaimedOpenTurn({
        hasPendingTurn: session.pendingTurn !== undefined,
        lastAssistant: last,
      })
    ) {
      return null;
    }

    await ctx.db.patch(args.sessionId, {
      pendingTurn: {
        prompt: args.prompt,
        requestedAt: Date.now(),
        attachmentStorageIds: args.attachmentStorageIds,
        ...(args.model !== undefined
          ? { model: normalizeAIModel(args.model) }
          : {}),
      },
      updatedAt: Date.now(),
    });
    console.log(
      `[sessionWorkflow] ensurePendingTurn restaged sessionId=${args.sessionId}`,
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
    v.object({ restaged: v.literal(true) }),
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
    // Stricter than the in-workflow re-stage: this path rebuilds the prompt from
    // the user message, so a bubble that already streamed text would replay it.
    if (
      lastAssistant === undefined ||
      !isUnclaimedOpenTurn({
        hasPendingTurn: session.pendingTurn !== undefined,
        lastAssistant,
      }) ||
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
    // Daemon-pull recovery only — Cursor/Codex/Opencode push via launch.
    if (getAIModelProvider(normalizeAIModel(session.lastModel)) !== "claude") {
      return {
        restaged: false as const,
        reason: "not a Claude daemon-pull session",
      };
    }
    const user = await ctx.db.get(session.userId);
    const rawMode = lastAssistant.mode ?? lastUser.mode ?? "edit";
    const mode: SessionPromptMode =
      rawMode === "plan" ||
      rawMode === "design" ||
      rawMode === "ask" ||
      rawMode === "execute" ||
      rawMode === "edit"
        ? rawMode
        : "edit";
    const { prompt } = await buildSessionPrompt(ctx, {
      session,
      repo,
      user,
      message: lastUser.content,
      mode,
      personaId: lastUser.personaId,
    });

    await ctx.db.patch(args.sessionId, {
      pendingTurn: {
        prompt,
        requestedAt: Date.now(),
        attachmentStorageIds: lastUser.attachmentStorageIds,
        ...(session.lastModel !== undefined
          ? { model: session.lastModel }
          : {}),
      },
      updatedAt: Date.now(),
    });
    console.log(
      `[sessionWorkflow] restageOpenTurn sessionId=${args.sessionId}`,
    );
    return { restaged: true as const };
  },
});

/**
 * Daemon-minted continuation turn. Inserts an assistant placeholder and arms a
 * stale handler so a crashed daemon cannot leave an empty bubble forever.
 */
export const openSyntheticTurn = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.object({ messageId: v.id("messages") }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const messageId = await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
      isSyntheticTurn: true,
    });
    await ctx.db.patch(args.sessionId, {
      syntheticTurnMessageId: messageId,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      internal.sessionWorkflow.handleStaleSyntheticTurn,
      { sessionId: args.sessionId, messageId },
    );
    return { messageId };
  },
});

/** Finalizes a synthetic continuation turn by messageId (never recency). */
export const completeSyntheticTurn = authMutation({
  args: {
    sessionId: v.id("sessions"),
    messageId: v.id("messages"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.sessionId));

    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.parentId !== args.sessionId ||
      message.finishedAt !== undefined
    ) {
      await ctx.db.patch(args.sessionId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedSessionMessage(ctx, args.sessionId);
      return null;
    }

    const patch: {
      content: string;
      activityLog?: string;
      finishedAt: number;
      pendingQuestion?: string;
    } = {
      content: args.success
        ? args.result || "I couldn't process your message."
        : `Error: ${args.error || "Unknown error during execution."}`,
      finishedAt: Date.now(),
    };
    if (args.activityLog) {
      patch.activityLog = args.activityLog;
    }
    if (args.pendingQuestion) {
      patch.pendingQuestion = args.pendingQuestion;
    }
    await ctx.db.patch(args.messageId, patch);

    await ctx.db.patch(args.sessionId, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
      agentBrowsingAt: undefined,
    });
    await startNextQueuedSessionMessage(ctx, args.sessionId);
    return null;
  },
});

/** Crash hygiene for daemon-minted continuations left open after daemon death. */
export const handleStaleSyntheticTurn = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    messageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.syntheticTurnMessageId !== args.messageId) {
      return null;
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.finishedAt !== undefined) {
      await ctx.db.patch(args.sessionId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      return null;
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();
    const streamingStale =
      streaming === null ||
      Date.now() - (streaming.lastUpdatedAt ?? 0) > 2 * 60 * 1000;
    if (!streamingStale) {
      // Still live — re-arm so a later daemon death is still cleaned up.
      await ctx.scheduler.runAfter(
        10 * 60 * 1000,
        internal.sessionWorkflow.handleStaleSyntheticTurn,
        { sessionId: args.sessionId, messageId: args.messageId },
      );
      return null;
    }

    await finalizeCancelledAssistantMessage(ctx, message, streaming);
    await clearStreamingActivity(ctx, String(args.sessionId));
    await ctx.db.patch(args.sessionId, {
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedSessionMessage(ctx, args.sessionId);
    return null;
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

    // One-shot providers (Cursor/Codex/Opencode) never claimPendingTurn, so
    // clear any leftover staged prompt here. Claude already cleared on claim.
    if (session.pendingTurn !== undefined) {
      await ctx.db.patch(args.sessionId, { pendingTurn: undefined });
    }

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
