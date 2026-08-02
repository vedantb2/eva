import {
  Button,
  PromptInput,
  PromptInputProvider,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  ModelSelect,
  usePromptInputController,
  toast,
  type PromptInputMessage,
  type ModelOption,
  type ModelAccount,
} from "@eva/ui";
import { ComposerSpeechButton } from "@/lib/components/chat/_components/ComposerSpeechButton";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_BYTES,
  CHAT_ATTACHMENT_ACCEPT,
  chatAttachmentErrorMessage,
  useUploadChatAttachments,
  ChatAttachmentPreview,
} from "@/lib/components/chat/imageAttachments";
import { ChatDraftSync } from "@/lib/components/chat/ChatDraftSync";
import { LocalChatDraftSync } from "@/lib/components/chat/LocalChatDraftSync";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { ChatTypeToFocus } from "@/lib/components/chat/ChatTypeToFocus";
import { ChatTypingLayer } from "@/lib/components/chat/ChatTypingLayer";
import { ComposerPlusMenu } from "@/lib/components/chat/_components/ComposerPlusMenu";
import { ComposerStash } from "@/lib/components/chat/_components/ComposerStash";
import { IconPlayerStop } from "@tabler/icons-react";
import { useRef, type ReactNode } from "react";
import { m, AnimatePresence } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  describeModelComposerControls,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type ProviderComposerCapability,
  type StoredModelTraits,
} from "@eva/backend";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { stripReviewCommentBlocks } from "@/lib/reviewComments";
import { tokenizedToEditable } from "@/lib/components/mentions";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import {
  QueuedMessagesPanel,
  type QueuedMessageItem,
} from "@/lib/components/QueuedMessagesPanel";
import type {
  ChatBodyPendingMessage,
  ChatBodyQueuedMessage,
} from "@/lib/components/chat/chatBodyUtils";
import { useQueuedMessageMutations } from "@/lib/components/chat/useQueuedMessageMutations";
import { ComposerCapabilityControls } from "./ComposerCapabilityControls";

/** localStorage-backed draft seed (no Convex row yet — e.g. new session). */
type LocalChatDraft = {
  initialDisplay: string;
  mentionMap: Map<string, string>;
  skillMap: Map<string, string>;
  onSave: (tokenized: string) => void;
};

interface ChatComposerProps {
  repoId: Id<"githubRepos">;
  repoBasePath: string;
  conversationId: string;
  queuedMessages: ChatBodyQueuedMessage[];
  pendingQueuedMessages: ChatBodyPendingMessage[];
  messageHistory: string[];
  isExecuting: boolean;
  isInputDisabled: boolean;
  placeholder: string;
  model: AIModel;
  setModel: (model: AIModel) => void;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  accounts?: ReadonlyArray<ModelAccount>;
  accountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
  displayTraits?: {
    effortLevel: ReasoningLevel | undefined;
    thinkingEnabled: boolean;
    use1mContext: boolean;
  };
  providerCapabilities?: ReadonlyArray<ProviderComposerCapability>;
  onTraitsChange?: (partial: Partial<StoredModelTraits>) => void;
  onSend: (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  beforeQueuedContent?: React.ReactNode;
  preInputContent?: React.ReactNode;
  /** Optional left-side control on the under-input card (e.g. base branch). */
  underCardLeading?: React.ReactNode;
  toolsBefore?: React.ReactNode;
  /** Optional "Options" submenu inside the composer "+" menu. */
  optionsSubmenu?: ReactNode;
  draft?: ChatDraftSeed;
  /** Persist draft in localStorage when no Convex conversation exists yet. */
  localDraft?: LocalChatDraft;
  isDraftLoading?: boolean;
  hasPendingContext?: boolean;
}

export function ChatComposer({
  repoId,
  repoBasePath,
  conversationId,
  queuedMessages,
  pendingQueuedMessages,
  messageHistory,
  isExecuting,
  isInputDisabled,
  placeholder,
  model,
  setModel,
  modelOptions,
  accounts,
  accountId,
  onAccountChange,
  displayTraits,
  providerCapabilities,
  onTraitsChange,
  onSend,
  onCancel,
  beforeQueuedContent,
  preInputContent,
  underCardLeading,
  toolsBefore,
  optionsSubmenu,
  draft,
  localDraft,
  isDraftLoading,
  hasPendingContext = false,
}: ChatComposerProps) {
  const skills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const dataMentions = useQuery(api.mentions.listData, { repoId }) ?? [];
  const currentUserId = useQuery(api.auth.me);
  const mentionRef = useRef<MentionTextareaHandle>(null);
  const uploadChatAttachments = useUploadChatAttachments();
  const { updateQueuedMessage, deleteQueuedMessage, reorderQueuedMessages } =
    useQueuedMessageMutations(queuedMessages);
  // Convex draft wins when both are passed (existing sessions).
  const seed = draft ?? localDraft;
  const capabilityControls = displayTraits
    ? describeModelComposerControls(model, displayTraits, providerCapabilities)
    : [];

  const handleSubmit = async (
    text: string,
    files: PromptInputMessage["files"],
  ) => {
    const visible = text.trim();
    const attachmentStorageIds = await uploadChatAttachments(files);
    if (files.length > 0 && attachmentStorageIds.length < files.length) {
      toast.error("Some attachments could not be uploaded.");
    }
    if (!visible && attachmentStorageIds.length === 0 && !hasPendingContext) {
      return;
    }
    const content = mentionRef.current?.tokenize(visible) ?? visible;
    await onSend(
      content,
      attachmentStorageIds.length > 0 ? attachmentStorageIds : undefined,
    );
  };

  const handlePromptSubmit = async ({ text, files }: PromptInputMessage) => {
    if (isInputDisabled) return;
    await handleSubmit(text, files);
  };

  const queuedMessageItems: QueuedMessageItem[] = queuedMessages.map(
    (message) => ({
      id: String(message._id),
      serverId: message._id,
      content: message.displayContent ?? message.content,
      model: message.model,
      reasoningLevel: message.reasoningLevel,
      userId: message.userId,
    }),
  );
  for (const pendingMessage of pendingQueuedMessages) {
    queuedMessageItems.push({
      id: `turn:${pendingMessage.turnId}:queue`,
      serverId: undefined,
      content: pendingMessage.content,
      model: pendingMessage.model,
      reasoningLevel: pendingMessage.reasoningLevel,
      userId: pendingMessage.userId,
    });
  }

  return (
    <div className="p-2 md:p-3 max-w-3xl mx-auto w-full">
      <AnimatePresence initial={false}>
        {beforeQueuedContent ? (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {beforeQueuedContent}
          </m.div>
        ) : null}
      </AnimatePresence>
      {preInputContent}
      <QueuedMessagesPanel
        items={queuedMessageItems}
        renderContent={(content) => {
          const stripped = stripReviewCommentBlocks(content);
          const display = tokenizedToEditable(stripped.text).displayText;
          const suffix =
            stripped.reviewCommentCount > 0
              ? ` · ${stripped.reviewCommentCount} review comment${stripped.reviewCommentCount === 1 ? "" : "s"}`
              : "";
          return (
            <MessageMentionText
              as="span"
              text={`${display}${suffix}`}
              repoBasePath={repoBasePath}
              className="text-xs leading-4 text-foreground/90"
            />
          );
        }}
        onEdit={async (id, content) => {
          await updateQueuedMessage({ id, content });
        }}
        onDelete={async (id) => {
          await deleteQueuedMessage({ id });
        }}
        onReorder={async (orderedIds) => {
          const parentId = queuedMessages[0]?.parentId;
          if (!parentId) return;
          await reorderQueuedMessages({ parentId, orderedIds });
        }}
      />
      <div className="relative">
        {isDraftLoading ? (
          // Placeholder that matches the input group's visual footprint.
          // Keeps the layout stable while the draft query resolves, and
          // prevents the PromptInputProvider from mounting with an empty
          // initialInput before the persisted draft is known.
          <div
            aria-busy="true"
            aria-label="Loading draft..."
            className="pointer-events-none rounded-surface border border-border shadow-lg bg-background opacity-50 min-h-[4.5rem]"
          />
        ) : (
          <PromptInputProvider initialInput={seed?.initialDisplay}>
            <ChatTypingLayer
              roomId={`typing:chat:${conversationId}`}
              userId={currentUserId}
            />
            <ChatTypeToFocus
              mentionRef={mentionRef}
              disabled={isInputDisabled}
            />
            {draft && (
              <ChatDraftSync
                target={draft.target}
                mentionRef={mentionRef}
                initialDisplay={draft.initialDisplay}
              />
            )}
            {!draft && localDraft && (
              <LocalChatDraftSync
                mentionRef={mentionRef}
                initialDisplay={localDraft.initialDisplay}
                onSave={localDraft.onSave}
              />
            )}
            <PromptInput
              onSubmit={handlePromptSubmit}
              accept={CHAT_ATTACHMENT_ACCEPT}
              multiple
              maxFiles={MAX_CHAT_ATTACHMENTS}
              maxFileSize={MAX_CHAT_ATTACHMENT_BYTES}
              onError={(err) =>
                toast.error(chatAttachmentErrorMessage(err))
              }
            >
              <ChatAttachmentPreview />
              <MentionTextarea
                ref={mentionRef}
                repoBasePath={repoBasePath}
                repoId={repoId}
                skills={skills}
                skillsSettingsHref={`${repoBasePath}/settings/skills`}
                placeholder={isExecuting ? "Add a follow-up..." : placeholder}
                initialMentionMap={seed?.mentionMap}
                initialSkillMap={seed?.skillMap}
                history={messageHistory}
                enableAttachmentPaste
                completionContext={`a message instructing an AI coding agent working on the repository ${repoBasePath.replace(/^\//, "")}`}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <ComposerPlusMenu
                    dataItems={dataMentions}
                    skills={skills}
                    mentionRef={mentionRef}
                    optionsSubmenu={optionsSubmenu}
                  />
                  {toolsBefore}
                  <ComposerStash
                    repoId={repoId}
                    mentionRef={mentionRef}
                    disabled={isInputDisabled}
                  />
                </PromptInputTools>
                <div className="flex min-w-0 items-center gap-1">
                  <ModelSelect
                    value={model}
                    options={modelOptions}
                    onValueChange={setModel}
                    accounts={accounts}
                    accountId={accountId}
                    onAccountChange={onAccountChange}
                    className="max-w-48 truncate sm:max-w-none"
                  />
                  {onTraitsChange && displayTraits ? (
                    <ComposerCapabilityControls
                      controls={capabilityControls}
                      isExecuting={isExecuting}
                      onChange={onTraitsChange}
                    />
                  ) : null}
                  <ComposerSpeechButton disabled={isInputDisabled} />
                  {isExecuting ? (
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                      onClick={onCancel}
                      title="Stop Eva"
                    >
                      <IconPlayerStop className="size-4" />
                    </Button>
                  ) : null}
                  <ChatBodySubmit
                    disabled={isInputDisabled}
                    isExecuting={isExecuting}
                    hasPendingContext={hasPendingContext}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </PromptInputProvider>
        )}
      </div>
      {underCardLeading ? (
        <div className="mx-auto flex w-[calc(100%-1.5rem)] items-center rounded-b-surface border border-border bg-muted/50 px-1.5 py-1">
          <div className="min-w-0">{underCardLeading}</div>
        </div>
      ) : null}
    </div>
  );
}

function ChatBodySubmit({
  disabled,
  isExecuting,
  hasPendingContext,
}: {
  disabled: boolean;
  isExecuting: boolean;
  hasPendingContext: boolean;
}) {
  const { textInput, attachments } = usePromptInputController();
  const isEmpty =
    textInput.value.trim().length === 0 && attachments.files.length === 0;

  return (
    <PromptInputSubmit
      disabled={disabled || (isEmpty && !hasPendingContext)}
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}
