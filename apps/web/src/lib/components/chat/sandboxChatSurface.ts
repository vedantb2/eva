import type {
  AIModel,
  BackgroundAgentEntry,
  Id,
  StoredModelTraits,
  resolveTraitsForDisplay,
} from "@eva/backend";
import type { ModelAccount, ModelOption } from "@eva/ui";
import type { SandboxTab } from "@/lib/search-params";
import type { ChatDraftTarget } from "@/lib/components/chat/useChatDraftSeed";
import type {
  ChatBodyMessage,
  ChatBodyQueuedMessage,
} from "@/lib/components/chat/chatBodyUtils";

/**
 * Which entity a sandbox chat belongs to. The three surfaces (session, quick
 * task, project) differ only in their Convex functions and id shapes, so every
 * shared chat piece takes this instead of an id plus a flag.
 */
export type ChatEntityRef =
  | { kind: "session"; sessionId: Id<"sessions"> }
  | { kind: "task"; taskId: Id<"agentTasks"> }
  | { kind: "project"; projectId: Id<"projects"> };

export interface ChatEntityKeys {
  /** Transcript owner for `messages`/`queuedMessages.listByParent`. */
  parentId: Id<"sessions"> | Id<"agentTasks"> | Id<"projects">;
  /** `api.streaming.get` entity id for this surface's chat turn. */
  streamingEntityId: string;
  /**
   * Entity id as `logs` and `pendingQuestions` rows carry it — the bare entity
   * id, never the streaming prefix.
   */
  entityId: string;
  draftTarget: ChatDraftTarget;
}

/** Every id a shared chat piece derives from the entity. Pure; no hooks. */
export function chatEntityKeys(entity: ChatEntityRef): ChatEntityKeys {
  if (entity.kind === "session") {
    return {
      parentId: entity.sessionId,
      streamingEntityId: String(entity.sessionId),
      entityId: String(entity.sessionId),
      draftTarget: { kind: "sessionChat", sessionId: entity.sessionId },
    };
  }
  if (entity.kind === "task") {
    return {
      parentId: entity.taskId,
      streamingEntityId: `task-chat-${String(entity.taskId)}`,
      entityId: String(entity.taskId),
      draftTarget: { kind: "taskChat", taskId: entity.taskId },
    };
  }
  return {
    parentId: entity.projectId,
    streamingEntityId: `project-chat-${String(entity.projectId)}`,
    entityId: String(entity.projectId),
    draftTarget: { kind: "projectChat", projectId: entity.projectId },
  };
}

/** Everything the transcript needs, in the shape `ChatBody` consumes. */
export interface SandboxChatTranscript {
  messages: ChatBodyMessage[];
  queuedMessages: ChatBodyQueuedMessage[];
  streamingActivity?: string;
  streamingContent?: string;
  streamingPendingQuestion?: string;
}

/** Composer model / account / trait controls, owned by the entity's document. */
export interface SandboxChatComposerModel {
  model: AIModel;
  setModel: (model: AIModel) => void;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  accounts: ReadonlyArray<ModelAccount>;
  accountId: string | null;
  onAccountChange: (accountId: string | null) => void;
  displayTraits: ReturnType<typeof resolveTraitsForDisplay>;
  onTraitsChange: (partial: Partial<StoredModelTraits>) => void;
}

/**
 * The handle a chat surface hands to the shared chat pieces. Built inside the
 * leaf chat panel (or its bindings hook), never in a shell.
 */
export interface SandboxChatSurface {
  entity: ChatEntityRef;
  repoId: Id<"githubRepos">;
  transcript: SandboxChatTranscript;
  composerModel: SandboxChatComposerModel;
  isExecuting: boolean;
  isSwitchingAccount: boolean;
  sandboxRunning: boolean;
  /** Archived, PR-terminal, or otherwise unable to send. */
  isReadOnly: boolean;
  backgroundAgents?: BackgroundAgentEntry[];
  onSend: (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  /**
   * Sends a harness built-in (`/compact`) as a bare user message. Sessions
   * append pending review comments on the normal send path, so the command
   * needs its own entry point to reach the harness verbatim.
   */
  onSendCommand: (command: string) => void;
  /** Opens a sandbox tab and expands the sandbox pane. Unset on chat-only. */
  openSandboxTab?: (tab: SandboxTab) => void;
  /** Opens a file (by full sandbox path) in the Files tab. */
  onOpenFile?: (path: string) => void;
  /** Opens the Diffs tab; optional repo-relative path scrolls to that file. */
  onViewDiff?: (repoRelativePath?: string) => void;
}
