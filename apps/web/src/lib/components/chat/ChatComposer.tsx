import {
  Button,
  PromptInput,
  PromptInputProvider,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSpeech,
  PromptInputSubmit,
  ModelSelect,
  TraitsMenu,
  usePromptInputController,
  toast,
  type PromptInputMessage,
  type ModelOption,
  type ModelAccount,
} from "@conductor/ui";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_BYTES,
  chatAttachmentAccept,
  chatAttachmentErrorMessage,
  useUploadChatAttachments,
  ChatAttachmentPreview,
  type ChatAttachmentMode,
} from "@/lib/components/chat/imageAttachments";
import { ChatDraftSync } from "@/lib/components/chat/ChatDraftSync";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { ChatTypeToFocus } from "@/lib/components/chat/ChatTypeToFocus";
import { ChatTypingLayer } from "@/lib/components/chat/ChatTypingLayer";
import { IconPlayerStop } from "@tabler/icons-react";
import { useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  getModelTraits,
  getReasoningLevelLabel,
  modelHasTraits,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@conductor/backend";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { stripReviewCommentBlocks } from "@/lib/reviewComments";
import { tokenizedToEditable } from "@/lib/components/mentions";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import { QueuedMessagesPanel } from "@/lib/components/QueuedMessagesPanel";
import type { ChatBodyQueuedMessage } from "@/lib/components/chat/chatBodyUtils";
import { useQueuedMessageMutations } from "@/lib/components/chat/useQueuedMessageMutations";

interface ChatComposerProps {
  repoId: Id<"githubRepos">;
  repoBasePath: string;
  conversationId: string;
  queuedMessages: ChatBodyQueuedMessage[];
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
  onTraitsChange?: (partial: Partial<StoredModelTraits>) => void;
  onSend: (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  beforeQueuedContent?: React.ReactNode;
  preInputContent?: React.ReactNode;
  toolsBefore?: React.ReactNode;
  formatQueuedInfo?: (msg: ChatBodyQueuedMessage) => string | undefined;
  draft?: ChatDraftSeed;
  isDraftLoading?: boolean;
  hasPendingContext?: boolean;
  /** Session coding chat can attach HTML/MD/TXT; others stay images-only. */
  attachmentMode?: ChatAttachmentMode;
}

export function ChatComposer({
  repoId,
  repoBasePath,
  conversationId,
  queuedMessages,
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
  onTraitsChange,
  onSend,
  onCancel,
  beforeQueuedContent,
  preInputContent,
  toolsBefore,
  formatQueuedInfo,
  draft,
  isDraftLoading,
  hasPendingContext = false,
  attachmentMode = "images",
}: ChatComposerProps) {
  const docs = useQuery(api.docs.list, { repoId }) ?? [];
  const skills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const currentUserId = useQuery(api.auth.me);
  const mentionRef = useRef<MentionTextareaHandle>(null);
  const uploadChatAttachments = useUploadChatAttachments(attachmentMode);
  const { updateQueuedMessage, deleteQueuedMessage, reorderQueuedMessages } =
    useQueuedMessageMutations(queuedMessages);

  const handleSubmit = useCallback(
    async (text: string, files: PromptInputMessage["files"]) => {
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
    },
    [onSend, uploadChatAttachments, hasPendingContext],
  );

  const handlePromptSubmit = async ({ text, files }: PromptInputMessage) => {
    if (isInputDisabled) return;
    await handleSubmit(text, files);
  };

  const queuedMessageItems = useMemo(
    () =>
      queuedMessages.map((message) => ({
        id: message._id,
        content: message.content,
        info: formatQueuedInfo?.(message),
      })),
    [queuedMessages, formatQueuedInfo],
  );

  return (
    <div className="p-2 md:p-3 max-w-3xl mx-auto w-full">
      <AnimatePresence initial={false}>
        {beforeQueuedContent ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {beforeQueuedContent}
          </motion.div>
        ) : null}
      </AnimatePresence>
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
              className="text-xs leading-snug text-foreground/90"
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
      {preInputContent}
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
          <PromptInputProvider initialInput={draft?.initialDisplay}>
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
            <PromptInput
              onSubmit={handlePromptSubmit}
              accept={chatAttachmentAccept(attachmentMode)}
              multiple
              maxFiles={MAX_CHAT_ATTACHMENTS}
              maxFileSize={MAX_CHAT_ATTACHMENT_BYTES}
              onError={(err) =>
                toast.error(chatAttachmentErrorMessage(attachmentMode, err))
              }
            >
              <ChatAttachmentPreview />
              <MentionTextarea
                ref={mentionRef}
                repoBasePath={repoBasePath}
                docs={docs}
                skills={skills}
                skillsSettingsHref={`${repoBasePath}/settings/skills`}
                placeholder={isExecuting ? "Add a follow-up..." : placeholder}
                initialMentionMap={draft?.mentionMap}
                initialSkillMap={draft?.skillMap}
                history={messageHistory}
                enableImagePaste
              />
              <PromptInputFooter>
                <PromptInputTools>
                  {toolsBefore}
                  <ModelSelect
                    value={model}
                    options={modelOptions}
                    onValueChange={setModel}
                    accounts={accounts}
                    accountId={accountId}
                    onAccountChange={onAccountChange}
                    className="max-w-48 truncate sm:max-w-none"
                  />
                  {onTraitsChange && displayTraits && modelHasTraits(model) ? (
                    <TraitsMenu
                      config={getModelTraits(model)}
                      effortLevel={displayTraits.effortLevel}
                      thinkingEnabled={displayTraits.thinkingEnabled}
                      use1mContext={displayTraits.use1mContext}
                      getLevelLabel={getReasoningLevelLabel}
                      onEffortLevelChange={(level) => {
                        if (level === undefined) {
                          onTraitsChange({ effortLevel: undefined });
                          return;
                        }
                        const { reasoning } = getModelTraits(model);
                        if (!reasoning) return;
                        const match = reasoning.levels.find(
                          (entry) => entry === level,
                        );
                        if (match) {
                          onTraitsChange({ effortLevel: match });
                        }
                      }}
                      onThinkingEnabledChange={(enabled) =>
                        onTraitsChange({
                          thinkingEnabled: enabled ? undefined : false,
                        })
                      }
                      onUse1mContextChange={(use1m) =>
                        onTraitsChange({
                          use1mContext: use1m ? true : undefined,
                        })
                      }
                    />
                  ) : null}
                </PromptInputTools>
                <div className="flex min-w-0 items-center gap-1">
                  <PromptInputSpeech />
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
