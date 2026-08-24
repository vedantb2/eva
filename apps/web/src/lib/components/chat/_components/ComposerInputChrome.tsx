import {
  BorderBeam,
  Button,
  InputGroupAddon,
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  toast,
  cn,
  motionSpring,
  type ModelAccount,
  type ModelOption,
  type PromptInputMessage,
  usePromptInputController,
} from "@eva/ui";
import { LayoutGroup, m } from "motion/react";
import { ModelSelectWithTraits } from "@/lib/components/ModelSelectWithTraits";
import { ComposerSpeechButton } from "@/lib/components/chat/_components/ComposerSpeechButton";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_BYTES,
  CHAT_ATTACHMENT_ACCEPT,
  chatAttachmentErrorMessage,
  ChatAttachmentPreview,
} from "@/lib/components/chat/imageAttachments";
import { ComposerPlusMenu } from "@/lib/components/chat/_components/ComposerPlusMenu";
import { ComposerStash } from "@/lib/components/chat/_components/ComposerStash";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import { IconPlayerStop } from "@tabler/icons-react";
import type { RefObject } from "react";
import type {
  AIModel,
  Id,
  ReasoningLevel,
  StoredModelTraits,
} from "@eva/backend";
import { isEditorValueEmpty, type SlashItem } from "@/lib/components/mentions";

const COMPACT_EDITOR =
  "flex min-h-9 max-h-9 min-w-0 w-auto flex-1 items-center self-center overflow-x-auto whitespace-nowrap rounded-none px-1 py-2 text-left leading-5 scrollbar-none transition-[min-height,padding] duration-[var(--motion-base)] ease-[var(--motion-ease-out)] focus-visible:outline-hidden";
const EXPANDED_EDITOR =
  "min-h-16 max-h-50 w-full self-stretch overflow-y-auto rounded-none px-4 pt-3.5 pb-1 text-left transition-[min-height,padding] duration-[var(--motion-base)] ease-[var(--motion-ease-out)] focus-visible:outline-hidden";

/** Pill while the draft is one line; attachments still need the stacked card. */
function isComposerCompact(value: string, fileCount: number): boolean {
  if (fileCount > 0) return false;
  if (isEditorValueEmpty(value)) return true;
  return !value.includes("\n");
}

interface DataMenuItem {
  id: string;
  label: string;
  badge?: string;
  provider?: SlashItem["provider"];
  kind?: SlashItem["kind"];
  description?: string;
  personUserId?: Id<"users">;
}

export function ComposerInputChrome({
  repoId,
  repoBasePath,
  mentionRef,
  skillItems,
  plusDataItems,
  skillsSettingsHref,
  placeholder,
  isExecuting,
  isInputDisabled,
  hasPendingContext,
  model,
  setModel,
  modelOptions,
  accounts,
  accountId,
  onAccountChange,
  displayTraits,
  onTraitsChange,
  onPromptSubmit,
  onCancel,
  seedMentionMap,
  seedSkillMap,
  messageHistory,
}: {
  repoId: Id<"githubRepos">;
  repoBasePath: string;
  mentionRef: RefObject<MentionTextareaHandle | null>;
  skillItems: SlashItem[];
  plusDataItems: DataMenuItem[];
  skillsSettingsHref: string;
  placeholder: string;
  isExecuting: boolean;
  isInputDisabled: boolean;
  hasPendingContext: boolean;
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
  onPromptSubmit: (message: PromptInputMessage) => void | Promise<void>;
  onCancel: () => Promise<void>;
  seedMentionMap?: Map<string, string>;
  seedSkillMap?: Map<string, string>;
  messageHistory: string[];
}) {
  const { textInput, attachments } = usePromptInputController();
  const compact = isComposerCompact(textInput.value, attachments.files.length);

  const leftTools = (
    <m.div
      layout="position"
      layoutId="composer-left-tools"
      transition={motionSpring}
      className="flex items-center gap-1"
    >
      <ComposerPlusMenu
        dataItems={plusDataItems}
        skillItems={skillItems}
        mentionRef={mentionRef}
        compact={compact}
      />
      <ComposerStash
        repoId={repoId}
        mentionRef={mentionRef}
        disabled={isInputDisabled}
      />
    </m.div>
  );

  const rightTools = (
    <m.div
      layout="position"
      layoutId="composer-right-tools"
      transition={motionSpring}
      className="flex min-w-0 items-center gap-0.5"
    >
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
          className="rounded-full"
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
    </m.div>
  );

  return (
    <LayoutGroup>
      <BorderBeam
        active={isExecuting}
        colorVariant="colorful"
        className={compact ? "rounded-full" : "rounded-surface"}
      >
        <PromptInput
          data-mention-popup-anchor=""
          onSubmit={onPromptSubmit}
          accept={CHAT_ATTACHMENT_ACCEPT}
          multiple
          maxFiles={MAX_CHAT_ATTACHMENTS}
          maxFileSize={MAX_CHAT_ATTACHMENT_BYTES}
          onError={(err) => toast.error(chatAttachmentErrorMessage(err))}
          inputGroupClassName={cn(
            // Height interpolates to/from `auto` so the conversation viewport
            // grows with the composer instead of jumping when the pill snaps.
            "[interpolate-size:allow-keywords] transition-[color,box-shadow,border-color,border-radius,height] duration-[var(--motion-base)] ease-[var(--motion-ease-out)]",
            compact
              ? "h-12 items-center rounded-full py-1"
              : "h-auto rounded-surface",
          )}
        >
          <ChatAttachmentPreview />
          {compact ? (
            <InputGroupAddon
              align="inline-start"
              className="order-first gap-1 py-0 pl-1.5 pr-0 has-[>button]:ml-0"
            >
              {leftTools}
            </InputGroupAddon>
          ) : null}
          <MentionTextarea
            key="composer-editor"
            ref={mentionRef}
            repoBasePath={repoBasePath}
            repoId={repoId}
            skillItems={skillItems}
            skillsSettingsHref={skillsSettingsHref}
            placeholder={placeholder}
            initialMentionMap={seedMentionMap}
            initialSkillMap={seedSkillMap}
            history={messageHistory}
            enableAttachmentPaste
            completionContext={`a message instructing an AI coding agent working on the repository ${repoBasePath.replace(/^\//, "")}`}
            className={compact ? COMPACT_EDITOR : EXPANDED_EDITOR}
          />
          {compact ? (
            <InputGroupAddon
              align="inline-end"
              className="order-last gap-1 py-0 pr-1.5 pl-1 has-[>button]:mr-0"
            >
              {rightTools}
            </InputGroupAddon>
          ) : (
            <PromptInputFooter className="max-sm:gap-y-2 px-3 pb-3 pt-0">
              <PromptInputTools>{leftTools}</PromptInputTools>
              {rightTools}
            </PromptInputFooter>
          )}
        </PromptInput>
      </BorderBeam>
    </LayoutGroup>
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
      className="size-9"
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}
