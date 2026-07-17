import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
} from "@conductor/ui";
import { IconCode, IconClipboardList } from "@tabler/icons-react";
import { memo } from "react";
import { motion } from "motion/react";
import dayjs from "@conductor/shared/dates";
import { formatDuration } from "@conductor/shared/duration";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { ChatMessageActions } from "@/lib/components/chat/ChatMessageActions";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { UserAttachmentImages } from "@/lib/components/chat/imageAttachments";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import type { ParsedQuestion } from "@/lib/components/chat/chatBodyUtils";
import type { ChatBodyMessage } from "@/lib/components/chat/chatBodyUtils";

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
  onViewDiff?: (path: string) => void;
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
}: ChatMessageProps) {
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

  const isStreamingPlaceholder =
    message.role === "assistant" &&
    !message.content &&
    message.finishedAt === undefined;
  const showQuestions = isStreamingPlaceholder || isLast;

  return (
    <motion.div
      key={message._id}
      data-message-id={message._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <AIMessage from={message.role}>
        <MessageContent
          className={
            message.role === "user"
              ? "group rounded-surface bg-secondary text-foreground px-4 py-3"
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
                    <MessageMentionText
                      text={message.content}
                      repoBasePath={repoBasePath}
                    />
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
          <div className="flex items-center justify-end gap-2 mt-0.5 ml-auto">
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
            <UserMessageAvatar userId={message.userId} />
          </div>
        )}
      </AIMessage>
    </motion.div>
  );
});
