import {
  BorderBeam,
  Button,
  motionBase,
  PromptInput,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTools,
  toast,
  type ModelAccount,
  type ModelOption,
  type PromptInputMessage,
  usePromptInputController,
} from "@eva/ui";
import { ModelSelectWithTraits } from "@/lib/components/ModelSelectWithTraits";
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
import { usePeopleMentionItems } from "@/lib/hooks/usePeopleMentionItems";
import { useDataMentionItems } from "@/lib/hooks/useDataMentionItems";
import {
  mergeMentionItems,
  tokenizedToEditable,
} from "@/lib/components/mentions";
import { IconPlayerStop } from "@tabler/icons-react";
import { useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  getAIModelProvider,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { stripReviewCommentBlocks } from "@/lib/reviewComments";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import { useSkillSlashItems } from "@/lib/hooks/useSkillSlashItems";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import { QueuedMessagesPanel } from "@/lib/components/QueuedMessagesPanel";
import type { ChatBodyQueuedMessage } from "@/lib/components/chat/chatBodyUtils";
import { useQueuedMessageMutations } from "@/lib/components/chat/useQueuedMessageMutations";

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
    fastMode: boolean;
  };
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
  /** Optional left-side controls on the under-input card (e.g. design tools). */
  toolsBefore?: React.ReactNode;
  mode?: SessionMode;
  onModeChange?: (mode: SessionMode) => void;
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
  underCardLeading,
  toolsBefore,
  mode,
  onModeChange,
  draft,
  localDraft,
  isDraftLoading,
  hasPendingContext = false,
}: ChatComposerProps) {
  const skillItems = useSkillSlashItems(repoId, getAIModelProvider(model));
  const dataMentions = useDataMentionItems(repoId);
  const peopleMentions = usePeopleMentionItems(repoId);
  const { items: plusDataItems } = mergeMentionItems(
    peopleMentions,
    dataMentions,
  );
  const currentUserId = useQuery(api.auth.me);
  const mentionRef = useRef<MentionTextareaHandle>(null);
  const uploadChatAttachments = useUploadChatAttachments();
  const { updateQueuedMessage, deleteQueuedMessage, reorderQueuedMessages } =
    useQueuedMessageMutations(queuedMessages);
  // Convex draft wins when both are passed (existing sessions).
  const seed = draft ?? localDraft;

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

  const queuedMessageItems = queuedMessages.map((message) => ({
    id: message._id,
    content: message.displayContent ?? message.content,
    model: message.model,
    reasoningLevel: message.reasoningLevel,
    userId: message.userId,
  }));

  return (
    <div className="p-3 md:p-4 max-w-3xl mx-auto w-full">
      <AnimatePresence initial={false}>
        {beforeQueuedContent ? (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={motionBase}
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
      {/* Beam runs while the agent is replying — radius matches the input group. */}
      <BorderBeam
        active={isExecuting && !isDraftLoading}
        colorVariant="colorful"
        className="rounded-control"
      >
        {isDraftLoading ? (
          // Placeholder that matches the input group's visual footprint.
          // Keeps the layout stable while the draft query resolves, and
          // prevents the PromptInputProvider from mounting with an empty
          // initialInput before the persisted draft is known.
          <div
            aria-busy="true"
            aria-label="Loading draft..."
            className="pointer-events-none rounded-surface smooth-shadow-ring-lg bg-background opacity-50 min-h-18"
          />
        ) : (
          <PromptInputProvider initialInput={seed?.initialDisplay}>
            <ChatTypingLayer
              roomId={`typing:chat:${conversationId}`}
              userId={currentUserId}
            />
            <ChatTypeToFocus mentionRef={mentionRef} />
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
              // The `@`/`/` picker renders as a full-width panel above this
              // card and matches its width — see MentionEditor `popupLayout`.
              data-mention-popup-anchor=""
              onSubmit={handlePromptSubmit}
              accept={CHAT_ATTACHMENT_ACCEPT}
              multiple
              maxFiles={MAX_CHAT_ATTACHMENTS}
              maxFileSize={MAX_CHAT_ATTACHMENT_BYTES}
              onError={(err) => toast.error(chatAttachmentErrorMessage(err))}
            >
              <ChatAttachmentPreview />
              <MentionTextarea
                ref={mentionRef}
                repoBasePath={repoBasePath}
                repoId={repoId}
                skillItems={skillItems}
                skillsSettingsHref={`${repoBasePath}/settings/skills`}
                placeholder={isExecuting ? "Add a follow-up..." : placeholder}
                initialMentionMap={seed?.mentionMap}
                initialSkillMap={seed?.skillMap}
                history={messageHistory}
                enableAttachmentPaste
                completionContext={`a message instructing an AI coding agent working on the repository ${repoBasePath.replace(/^\//, "")}`}
              />
              {/* Wraps rather than squashing: the footer holds five controls and
                  the chat pane goes down to 350px on desktop and a full phone
                  width below `md`. No effect while everything fits. */}
              <PromptInputFooter className="max-sm:gap-y-2 px-4 pb-4">
                <PromptInputTools>
                  <ComposerPlusMenu
                    dataItems={plusDataItems}
                    skillItems={skillItems}
                    mentionRef={mentionRef}
                    mode={mode}
                    onModeChange={onModeChange}
                  />
                  {toolsBefore}
                  <ComposerStash
                    repoId={repoId}
                    mentionRef={mentionRef}
                    disabled={isInputDisabled}
                  />
                </PromptInputTools>
                <div className="flex min-w-0 items-center gap-1">
                  <ModelSelectWithTraits
                    value={model}
                    options={modelOptions}
                    onValueChange={setModel}
                    accounts={accounts}
                    accountId={accountId}
                    onAccountChange={onAccountChange}
                    traits={displayTraits}
                    onTraitsChange={onTraitsChange}
                  />
                  <ComposerSpeechButton disabled={isInputDisabled} />
                  {isExecuting ? (
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                      onClick={onCancel}
                      aria-label="Stop Eva"
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
      </BorderBeam>
      {underCardLeading ? (
        <div className="mx-auto flex w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] items-center rounded-b-surface bg-muted/70 px-2 py-1.5">
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
