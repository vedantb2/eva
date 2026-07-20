"use client";

import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  cn,
} from "@conductor/ui";
import { IconCode, IconClipboardList } from "@tabler/icons-react";
import { memo } from "react";
import { motion } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import { formatDuration } from "@conductor/shared/duration";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { ReviewCommentMessage } from "@/lib/components/chat/ReviewCommentMessage";
import { CollapsibleUserMessageBody } from "@/lib/components/chat/CollapsibleUserMessageBody";
import { ChatMessageActions } from "@/lib/components/chat/ChatMessageActions";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { UserAttachmentImages } from "@/lib/components/chat/imageAttachments";
import {
  ChangedFilesCard,
  collectChangedFiles,
} from "@/lib/components/chat/ChangedFilesCard";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import type {
  ParsedQuestion,
  ChatBodyMessage,
} from "@/lib/components/chat/chatBodyUtils";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";

const EVA_ICON = <EvaIcon />;

interface ChatMessageProps {
  message: ChatBodyMessage;
  repoBasePath: string;
  isLast: boolean;
  streamingActivity?: string;
  streamingContent?: string;
  blockingQuestions?: ParsedQuestion[] | null;
  activePendingQuestion?: ParsedQuestion[] | null;
  isExecuting: boolean;
  onQuestionAnswer: (answer: string) => Promise<void>;
  onBlockingAnswer: (answers: Record<string, string>) => Promise<void>;
  onOpenFile?: (path: string) => void;
  onViewDiff?: (repoRelativePath?: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  repoBasePath,
  isLast,
  streamingActivity,
  streamingContent,
  blockingQuestions,
  activePendingQuestion,
  isExecuting,
  onQuestionAnswer,
  onBlockingAnswer,
  onOpenFile,
  onViewDiff,
}: ChatMessageProps) {
  const currentUserId = useQuery(api.auth.me);

  if (message.isSystemAlert) {
    return (
      <SystemAlertMessage
        key={message._id}
        content={message.content ?? ""}
        errorDetail={message.errorDetail}
        timestamp={message.timestamp}
      />
    );
  }

  // Only your own user turns stay right-aligned; teammates sit on the left
  // (same bubble style). Missing userId / auth still loading → treat as own.
  const isOtherUserMessage =
    message.role === "user" &&
    message.userId !== undefined &&
    currentUserId !== undefined &&
    message.userId !== currentUserId;

  const isStreamingPlaceholder =
    message.role === "assistant" &&
    !message.content &&
    message.finishedAt === undefined;
  const showQuestions = isStreamingPlaceholder || isLast;
  const changedFiles =
    !isStreamingPlaceholder &&
    message.role === "assistant" &&
    message.activityLog
      ? collectChangedFiles(parseActivitySteps(message.activityLog) ?? [])
      : [];

  return (
    <motion.div
      key={message._id}
      data-message-id={message._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <AIMessage
        from={message.role}
        className={
          isOtherUserMessage ? "ml-0 mr-auto justify-start" : undefined
        }
      >
        <MessageContent
          className={
            message.role === "user"
              ? cn(
                  "group rounded-surface bg-secondary text-foreground px-4 py-3",
                  isOtherUserMessage && "group-[.is-user]:ml-0",
                )
              : "px-1 py-2"
          }
        >
          {isStreamingPlaceholder ? (
            <>
              <StreamingActivityDisplay
                activity={streamingActivity}
                name="Eva"
                startedAt={message.timestamp}
                onOpenFile={onOpenFile}
              />
              {isLast && streamingContent ? (
                <MessageResponse className="prose prose-sm dark:prose-invert max-w-none mt-2">
                  {streamingContent}
                </MessageResponse>
              ) : null}
              {showQuestions && blockingQuestions ? (
                <div className="mt-3">
                  <MultipleChoiceQuestion
                    questions={blockingQuestions}
                    onAnswer={onQuestionAnswer}
                    onAnswerStructured={onBlockingAnswer}
                    isLoading={isExecuting}
                  />
                </div>
              ) : showQuestions && activePendingQuestion ? (
                <div className="mt-3">
                  <MultipleChoiceQuestion
                    questions={activePendingQuestion}
                    onAnswer={onQuestionAnswer}
                    isLoading={isExecuting}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              {message.role === "assistant" ? (
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
                  <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </MessageResponse>
                  {changedFiles.length > 0 ? (
                    <ChangedFilesCard
                      files={changedFiles}
                      onOpenFile={onOpenFile}
                      onViewDiff={onViewDiff}
                    />
                  ) : null}
                  {message.imageUrl && (
                    <ScreenshotPreview url={message.imageUrl} />
                  )}
                  {message.videoUrl && <VideoPreview url={message.videoUrl} />}
                  {showQuestions && activePendingQuestion ? (
                    <div className="mt-3">
                      <MultipleChoiceQuestion
                        questions={activePendingQuestion}
                        onAnswer={onQuestionAnswer}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <UserAttachmentImages urls={message.attachmentUrls} />
                  {message.content ? (
                    <CollapsibleUserMessageBody text={message.content}>
                      <ReviewCommentMessage
                        text={message.content}
                        repoBasePath={repoBasePath}
                      />
                    </CollapsibleUserMessageBody>
                  ) : null}
                </>
              )}
            </>
          )}
        </MessageContent>
        {message.role === "assistant" && message.content ? (
          <div className="flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <ChatMessageActions
              copyText={message.content}
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
        {message.role === "user" && (
          <div
            className={cn(
              "mt-0.5 flex items-center gap-2",
              isOtherUserMessage
                ? "mr-auto justify-start"
                : "ml-auto justify-end",
            )}
          >
            {isOtherUserMessage ? (
              <UserMessageAvatar userId={message.userId} />
            ) : null}
            <div className="flex items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
              {message.content ? (
                <ChatMessageActions
                  copyText={message.content}
                  revealOnHover={false}
                />
              ) : null}
              {message.mode && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  {message.mode === "plan" ? (
                    <>
                      <IconClipboardList className="w-2.5 h-2.5" /> PRD
                    </>
                  ) : (
                    <>
                      <IconCode className="w-2.5 h-2.5" /> Edit
                    </>
                  )}
                </div>
              )}
              {message.credentialSourceLabel ? (
                <span className="text-[11px] text-muted-foreground/60">
                  {message.credentialSourceLabel}
                </span>
              ) : null}
              {message.timestamp && (
                <span className="text-[11px] text-muted-foreground/60">
                  {dayjs(message.timestamp).format("h:mm A")}
                </span>
              )}
            </div>
            {isOtherUserMessage ? null : (
              <UserMessageAvatar userId={message.userId} />
            )}
          </div>
        )}
      </AIMessage>
    </motion.div>
  );
});
