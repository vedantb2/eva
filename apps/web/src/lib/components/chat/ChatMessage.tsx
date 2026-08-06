import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  ProviderIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  formatModelDisplayLabel,
} from "@eva/ui";
import { IconCode, IconClipboardList } from "@tabler/icons-react";
import { memo } from "react";
import { m } from "motion/react";
import dayjs from "@eva/shared/dates";
import { formatDuration } from "@eva/shared/duration";
import { findAIModelOption, getReasoningLevelLabel } from "@eva/backend";
import { VideoPreview } from "@/lib/components/MediaPreview";
import { ImageGalleryPreview } from "@/lib/components/MediaGallery";
import { ReviewCommentMessage } from "@/lib/components/chat/ReviewCommentMessage";
import { CollapsibleUserMessageBody } from "@/lib/components/chat/CollapsibleUserMessageBody";
import { ChatMessageActions } from "@/lib/components/chat/ChatMessageActions";
import { ChatMessageContextMenu } from "@/lib/components/chat/ChatMessageContextMenu";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { UserMessageAttachments } from "@/lib/components/chat/imageAttachments";
import { ChangedFilesCard } from "@/lib/components/chat/ChangedFilesCard";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { tokenizedToDisplayText } from "@/lib/components/mentions";
import type {
  ParsedQuestion,
  ChatBodyMessage,
} from "@/lib/components/chat/chatBodyUtils";
import { getAssistantTurnState } from "@/lib/components/chat/chatBodyUtils";

const EVA_ICON = <EvaIcon />;

/** Squares the bottom-left corner against a teammate's side avatar. */
function otherUserBubbleRadius(): string {
  const r = "clamp(0.75rem, var(--radius), 1.25rem)";
  return `${r} ${r} ${r} 0`;
}

/** Provider mark under an assistant turn; tooltip lists model, effort, account. */
function MessageModelIcon({
  model,
  reasoningLevel,
  credentialSourceLabel,
}: {
  model: string;
  reasoningLevel?: string;
  credentialSourceLabel?: string;
}) {
  const option = findAIModelOption(model);
  const modelLabel = formatModelDisplayLabel(option.provider, option.label);
  const effortLabel = reasoningLevel
    ? getReasoningLevelLabel(reasoningLevel)
    : null;
  const parts = [modelLabel];
  if (effortLabel) parts.push(effortLabel);
  if (credentialSourceLabel) parts.push(credentialSourceLabel);
  const tooltip = parts.join(" · ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70"
          aria-label={tooltip}
        >
          <ProviderIcon provider={option.provider} size={12} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

interface ChatMessageProps {
  message: ChatBodyMessage;
  repoBasePath: string;
  isLast: boolean;
  /** True when this user turn belongs to a teammate (left-aligned). */
  isOtherUser?: boolean;
  /** First name shown above teammate bubbles. */
  senderFirstName?: string;
  /**
   * Preceding user turn's model snapshot — shown under the assistant reply
   * (model lives on the user message at send/dequeue time).
   */
  turnModel?: string;
  turnReasoningLevel?: string;
  /** "Team" or the selected userProviderAccounts label/first name. */
  turnCredentialSourceLabel?: string;
  streamingActivity?: string;
  streamingContent?: string;
  blockingQuestions?: ParsedQuestion[] | null;
  activePendingQuestion?: ParsedQuestion[] | null;
  /**
   * True only while an answer mutation/send is in flight. Must NOT mirror
   * turn `isExecuting` — AskUserQuestion keeps the turn executing while it
   * waits for the user, which would permanently disable the card.
   */
  isQuestionLoading?: boolean;
  onQuestionAnswer: (answer: string) => Promise<void>;
  onBlockingAnswer: (answers: Record<string, string>) => Promise<void>;
  onOpenFile?: (path: string) => void;
  onViewDiff?: (repoRelativePath?: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  repoBasePath,
  isLast,
  isOtherUser = false,
  senderFirstName,
  turnModel,
  turnReasoningLevel,
  turnCredentialSourceLabel,
  streamingActivity,
  streamingContent,
  blockingQuestions,
  activePendingQuestion,
  isQuestionLoading = false,
  onQuestionAnswer,
  onBlockingAnswer,
  onOpenFile,
  onViewDiff,
}: ChatMessageProps) {
  if (message.isSystemAlert) {
    return (
      <SystemAlertMessage
        content={message.content ?? ""}
        errorDetail={message.errorDetail}
        timestamp={message.timestamp}
      />
    );
  }

  const { isStreamingPlaceholder, showQuestions, changedFiles } =
    getAssistantTurnState(message, isLast);

  const copySource =
    message.content.trim().length > 0
      ? message.content
      : (streamingContent ?? "");
  const copyPlain = copySource ? tokenizedToDisplayText(copySource) : undefined;

  // Videos render as inline players; images collapse into one Twitter-style
  // grid + lightbox so a screenshot-heavy turn is not a long vertical stack.
  const mediaEntries = message.media ?? [];
  const videoMedia = mediaEntries.flatMap((entry) =>
    entry.url && entry.contentType?.startsWith("video/")
      ? [{ url: entry.url }]
      : [],
  );
  const imageMedia = mediaEntries.flatMap((entry) =>
    entry.url && !entry.contentType?.startsWith("video/")
      ? [{ url: entry.url }]
      : [],
  );

  return (
    <ChatMessageContextMenu content={copySource}>
      <m.div
        data-message-id={message._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <AIMessage
          from={message.role}
          className={
            isOtherUser ? "ml-0 mr-auto justify-start gap-1.5" : undefined
          }
        >
          {message.role === "user" ? (
            <div
              className={cn(
                "flex flex-col gap-0.5",
                isOtherUser ? "items-start" : "items-end",
              )}
            >
              {isOtherUser && senderFirstName ? (
                <span
                  data-pii
                  className={cn(
                    "text-[11px] font-medium text-muted-foreground",
                    // Avatar (16) + gap (8) + bubble px-3 (12) → align with bubble text
                    "pl-9",
                  )}
                >
                  {senderFirstName}
                </span>
              ) : null}
              {/* min-w-0 stops the default `min-width: auto` on this flex item
                  from letting one unbreakable token (a JWT, a long URL) stretch
                  the bubble past the message column. */}
              <div className="flex min-w-0 max-w-full items-end gap-2">
                {isOtherUser ? (
                  <div className="shrink-0">
                    <UserMessageAvatar userId={message.userId} />
                  </div>
                ) : null}
                <MessageContent
                  className={cn(
                    "group px-3 py-2 text-foreground",
                    isOtherUser
                      ? "bg-secondary group-[.is-user]:ml-0 group-[.is-user]:bg-secondary"
                      : "rounded-surface bg-primary/10 group-[.is-user]:bg-primary/10",
                  )}
                  style={
                    isOtherUser
                      ? { borderRadius: otherUserBubbleRadius() }
                      : undefined
                  }
                >
                  <UserMessageBody
                    message={message}
                    repoBasePath={repoBasePath}
                  />
                </MessageContent>
              </div>
              <UserMessageMeta
                align={isOtherUser ? "start" : "end"}
                copyPlain={copyPlain}
                mode={message.mode}
                timestamp={message.timestamp}
                className={isOtherUser ? "pl-6" : undefined}
              />
            </div>
          ) : (
            <>
              <MessageContent className="px-1 py-2">
                {isStreamingPlaceholder ? (
                  <>
                    <StreamingActivityDisplay
                      activity={streamingActivity}
                      name="Eva"
                      startedAt={message.timestamp}
                      onOpenFile={onOpenFile}
                    />
                    {streamingContent ? (
                      <MessageResponse className="prose prose-sm dark:prose-invert max-w-none mt-2 wrap-anywhere">
                        {streamingContent}
                      </MessageResponse>
                    ) : null}
                    {showQuestions && blockingQuestions ? (
                      <div className="mt-3">
                        <MultipleChoiceQuestion
                          key={blockingQuestions
                            .map((question) => question.question)
                            .join("\u0000")}
                          questions={blockingQuestions}
                          onAnswer={onQuestionAnswer}
                          onAnswerStructured={onBlockingAnswer}
                          isLoading={isQuestionLoading}
                        />
                      </div>
                    ) : showQuestions && activePendingQuestion ? (
                      <div className="mt-3">
                        <MultipleChoiceQuestion
                          questions={activePendingQuestion}
                          onAnswer={onQuestionAnswer}
                          isLoading={isQuestionLoading}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    {message.activityLog && (
                      <ActivityLogDisplay
                        activityLog={message.activityLog}
                        name="Eva"
                        icon={EVA_ICON}
                        startedAt={message.timestamp}
                        finishedAt={message.finishedAt}
                        finalText={message.content}
                        onOpenFile={onOpenFile}
                      />
                    )}
                    {/* wrap-anywhere: without it a long unbreakable token is
                        silently clipped by MessageContent's overflow-hidden. */}
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none wrap-anywhere">
                      {message.content}
                    </MessageResponse>
                    {changedFiles.length > 0 ? (
                      <ChangedFilesCard
                        files={changedFiles}
                        onOpenFile={onOpenFile}
                        onViewDiff={onViewDiff}
                      />
                    ) : null}
                    {videoMedia.map((entry, index) => (
                      // Capped to the same width `ImageGalleryPreview` uses, so
                      // a video and a screenshot in the same reply line up
                      // instead of the video spanning the whole pane.
                      <VideoPreview
                        key={index}
                        url={entry.url}
                        className="max-w-lg"
                      />
                    ))}
                    {imageMedia.length > 0 ? (
                      <ImageGalleryPreview images={imageMedia} />
                    ) : null}
                    {showQuestions && activePendingQuestion ? (
                      <div className="mt-3">
                        <MultipleChoiceQuestion
                          questions={activePendingQuestion}
                          onAnswer={onQuestionAnswer}
                          isLoading={isQuestionLoading}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </MessageContent>
              <div className="mt-0.5 flex items-center gap-2">
                {turnModel ? (
                  <MessageModelIcon
                    model={turnModel}
                    reasoningLevel={turnReasoningLevel}
                    credentialSourceLabel={turnCredentialSourceLabel}
                  />
                ) : null}
                {copyPlain ? (
                  <div className="flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                    <ChatMessageActions
                      copyText={copyPlain}
                      className="ml-0.5"
                      revealOnHover={false}
                    />
                    {message.finishedAt && message.timestamp ? (
                      <span className="text-[11px] tabular-nums text-muted-foreground/60">
                        {dayjs(message.timestamp).format("h:mm A")} ·{" "}
                        {formatDuration(message.timestamp, message.finishedAt)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </AIMessage>
      </m.div>
    </ChatMessageContextMenu>
  );
});

function UserMessageBody({
  message,
  repoBasePath,
}: {
  message: ChatBodyMessage;
  repoBasePath: string;
}) {
  return (
    <>
      <UserMessageAttachments
        attachments={
          message.attachments ??
          message.attachmentUrls?.map((url) => ({
            url,
            contentType: url ? "image/*" : null,
          }))
        }
      />
      {message.content ? (
        <CollapsibleUserMessageBody text={message.content}>
          <ReviewCommentMessage
            text={message.content}
            repoBasePath={repoBasePath}
          />
        </CollapsibleUserMessageBody>
      ) : null}
    </>
  );
}

function UserMessageMeta({
  align,
  copyPlain,
  mode,
  timestamp,
  className,
}: {
  align: "start" | "end";
  copyPlain?: string;
  mode?: ChatBodyMessage["mode"];
  timestamp?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100",
        align === "start" ? "justify-start" : "justify-end",
        className,
      )}
    >
      {copyPlain ? (
        <ChatMessageActions copyText={copyPlain} revealOnHover={false} />
      ) : null}
      {mode ? (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
          {mode === "plan" ? (
            <>
              <IconClipboardList className="h-2.5 w-2.5" /> Plan
            </>
          ) : (
            <>
              <IconCode className="h-2.5 w-2.5" /> Edit
            </>
          )}
        </div>
      ) : null}
      {timestamp ? (
        <span className="text-[11px] text-muted-foreground/60">
          {dayjs(timestamp).format("h:mm A")}
        </span>
      ) : null}
    </div>
  );
}