import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { authMutation, authQuery, getChatWithAccess } from "./functions";
import {
  aiModelValidator,
  assertModelMatchesLockedProvider,
  chatFields,
  chatParentIdValidator,
  normalizeAIModel,
  reasoningLevelValidator,
} from "./validators";
import { resolveDefaultProviderAccountId } from "./_userProviderAccounts/defaults";
import { assertProviderAccountUsableBy } from "./_userProviderAccounts/defaults";
import { resolveChatParent } from "./_chats/parent";
import { CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";

const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";
const MAX_TITLE_LENGTH = 64;

const chatValidator = v.object({
  _id: v.id("chats"),
  _creationTime: v.number(),
  ...chatFields,
  isRunning: v.boolean(),
});

function withRunning(chat: Doc<"chats">) {
  return {
    ...chat,
    isRunning:
      chat.activeWorkflowId !== undefined || chat.pendingTurn !== undefined,
  };
}

/** Short, deterministic title used until a user explicitly renames the chat. */
export function titleFromFirstMessage(message: string): string {
  const plain = message
    .replace(/@\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "New chat";
  if (plain.length <= MAX_TITLE_LENGTH) return plain;
  const clipped = plain.slice(0, MAX_TITLE_LENGTH + 1);
  const wordBoundary = clipped.lastIndexOf(" ");
  const title = clipped.slice(
    0,
    wordBoundary >= MAX_TITLE_LENGTH / 2 ? wordBoundary : MAX_TITLE_LENGTH,
  );
  return `${title.trim()}…`;
}

async function parentComposerDefaults(
  db: Parameters<typeof resolveChatParent>[0],
  parentId: Id<"sessions"> | Id<"projects"> | Id<"agentTasks">,
) {
  const rawId = String(parentId);
  const sessionId = db.normalizeId("sessions", rawId);
  if (sessionId) {
    const session = await db.get(sessionId);
    if (!session) throw new Error("Session not found");
    return {
      model: session.lastModel,
      reasoningLevel: session.lastReasoningLevel,
      thinkingEnabled: session.lastThinkingEnabled,
      use1mContext: session.lastUse1mContext,
      fastMode: session.lastFastMode,
    };
  }
  const projectId = db.normalizeId("projects", rawId);
  if (projectId) {
    const project = await db.get(projectId);
    if (!project) throw new Error("Project not found");
    return {
      model: project.lastChatModel ?? project.model,
      reasoningLevel: project.lastReasoningLevel,
      thinkingEnabled: project.lastThinkingEnabled,
      use1mContext: project.lastUse1mContext,
      fastMode: project.lastFastMode,
    };
  }
  const taskId = db.normalizeId("agentTasks", rawId);
  if (!taskId) throw new Error("Chat parent not found");
  const task = await db.get(taskId);
  if (!task) throw new Error("Task not found");
  return {
    model: task.lastChatModel ?? task.model,
    reasoningLevel: task.lastReasoningLevel,
    thinkingEnabled: task.lastThinkingEnabled,
    use1mContext: task.lastUse1mContext,
    fastMode: task.lastFastMode,
  };
}

export const listByParent = authQuery({
  args: { parentId: chatParentIdValidator },
  returns: v.array(chatValidator),
  handler: async (ctx, args) => {
    await resolveChatParent(ctx.db, args.parentId, ctx.userId);
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    return chats
      .sort((a, b) => a._creationTime - b._creationTime)
      .map(withRunning);
  },
});

export const get = authQuery({
  args: { id: v.id("chats") },
  returns: v.union(chatValidator, v.null()),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.id, ctx.userId);
    return withRunning(chat);
  },
});

export const create = authMutation({
  args: { parentId: chatParentIdValidator },
  returns: v.id("chats"),
  handler: async (ctx, args) => {
    const parent = await resolveChatParent(ctx.db, args.parentId, ctx.userId);
    const defaults = await parentComposerDefaults(ctx.db, args.parentId);
    const providerAccountId = await resolveDefaultProviderAccountId(
      ctx.db,
      ctx.userId,
      defaults.model,
    );
    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      parentId: args.parentId,
      repoId: parent.repoId,
      createdBy: ctx.userId,
      updatedAt: now,
      lastModel: defaults.model,
      lastReasoningLevel: defaults.reasoningLevel,
      lastThinkingEnabled: defaults.thinkingEnabled,
      lastUse1mContext: defaults.use1mContext,
      lastFastMode: defaults.fastMode,
      providerAccountId,
    });
    await ctx.db.patch(args.parentId, { updatedAt: now });
    return chatId;
  },
});

export const rename = authMutation({
  args: { id: v.id("chats"), title: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getChatWithAccess(ctx.db, args.id, ctx.userId);
    const title = args.title.replace(/\s+/g, " ").trim();
    if (!title) throw new Error("Chat title cannot be empty");
    if (title.length > MAX_TITLE_LENGTH) {
      throw new Error(
        `Chat title must be ${MAX_TITLE_LENGTH} characters or less`,
      );
    }
    await ctx.db.patch(args.id, { title });
    return null;
  },
});

export const setArchived = authMutation({
  args: { id: v.id("chats"), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.id, ctx.userId);
    if (args.archived) {
      const queued = await ctx.db
        .query("queuedMessages")
        .withIndex("by_parent_and_created", (q) => q.eq("parentId", args.id))
        .first();
      if (chat.activeWorkflowId || chat.pendingTurn || queued) {
        throw new Error(
          "Stop this chat and clear its queue before archiving it",
        );
      }
    }
    await ctx.db.patch(args.id, {
      archived: args.archived ? true : undefined,
    });
    return null;
  },
});

export const setModel = authMutation({
  args: { id: v.id("chats"), model: aiModelValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.id, ctx.userId);
    assertModelMatchesLockedProvider(chat.provider, args.model);
    const providerAccountId = await resolveDefaultProviderAccountId(
      ctx.db,
      chat.createdBy,
      args.model,
    );
    await ctx.db.patch(args.id, { lastModel: args.model, providerAccountId });
    return null;
  },
});

export const setProviderAccountId = authMutation({
  args: {
    id: v.id("chats"),
    providerAccountId: v.union(v.id("userProviderAccounts"), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.id, ctx.userId);
    const providerAccountId = await assertProviderAccountUsableBy(
      ctx.db,
      args.providerAccountId,
      chat.createdBy,
    );
    await ctx.db.patch(args.id, { providerAccountId });
    return null;
  },
});

export const setTraits = authMutation({
  args: {
    id: v.id("chats"),
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getChatWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      lastFastMode: args.fastMode,
    });
    return null;
  },
});

/** Page-open/tab-switch prewarm for an isolated side-chat daemon. */
export const prewarmDaemon = authMutation({
  args: { id: v.id("chats") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await getChatWithAccess(ctx.db, args.id, ctx.userId);
    if (chat.archived) return null;
    const parent = await resolveChatParent(ctx.db, chat.parentId, ctx.userId);
    if (!parent.sandboxId || !parent.sandboxActive) return null;
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
      sandboxId: parent.sandboxId,
      repoId: chat.repoId,
      userId: ctx.userId,
      entityId: String(chat._id),
      streamingEntityId: String(chat._id),
      entityIdField: "chatId",
      completionMutation: "chatWorkflow:handleCompletion",
      ...CHAT_DAEMON_MUTATIONS,
      model: normalizeAIModel(chat.lastModel),
      reasoningLevel: chat.lastReasoningLevel,
      thinkingEnabled: chat.lastThinkingEnabled,
      use1mContext: chat.lastUse1mContext,
      fastMode: chat.lastFastMode,
      allowedTools: CHAT_ALLOWED_TOOLS,
      providerAccountId: chat.providerAccountId,
      credentialOwnerUserId: chat.createdBy,
      sessionPersistenceId: chat._id,
      activeWorkflowField: "activeWorkflowId",
      laneKey: String(chat._id),
      mcpEntityId: String(chat.parentId),
      mcpEntityKind: parent.parentKind,
      entityTable: "chats",
    });
    return null;
  },
});
