import {
  Avatar,
  AvatarFallback,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
} from "@eva/ui";
import { UserInitials } from "@eva/shared";
import { EvaIcon } from "@/lib/components/EvaIcon";
import dayjs from "@eva/shared/dates";
import type { Id } from "@eva/backend";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { ChatMessageContextMenu } from "@/lib/components/chat/ChatMessageContextMenu";
import { m } from "motion/react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logs?: string;
  isStreaming?: boolean;
  userId?: Id<"users">;
  // Stamped when the assistant placeholder was inserted (drives the live
  // timer while streaming) and when the run completed (drives the static
  // duration label on the collapsed activity accordion).
  startedAt?: number;
  finishedAt?: number;
}

export function ChatMessage({
  role,
  content,
  logs,
  isStreaming,
  userId,
  startedAt,
  finishedAt,
}: ChatMessageProps) {
  const isUser = role === "user";

  const evaIcon = (
    <EvaIcon
      size={20}
      className="rounded-full outline outline-1 outline-black/10 dark:outline-white/10"
    />
  );

  const messageBody = (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <AIMessage from={role}>
        <MessageContent
          className={
            isUser
              ? "rounded-surface bg-secondary text-foreground px-4 py-3"
              : "px-1 py-2"
          }
        >
          {isStreaming ? (
            <StreamingActivityDisplay
              activity={content}
              name="Eva"
              startedAt={startedAt}
            />
          ) : (
            <>
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {content}
                </p>
              ) : (
                <>
                  {logs && (
                    <ActivityLogDisplay
                      activityLog={logs}
                      name="Eva"
                      icon={evaIcon}
                      startedAt={startedAt}
                      finishedAt={finishedAt}
                      finalText={content}
                    />
                  )}
                  <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                    {content}
                  </MessageResponse>
                </>
              )}
            </>
          )}
        </MessageContent>
        {isUser && (
          <div className="flex items-center justify-end gap-2 mt-0.5 ml-auto">
            {startedAt !== undefined ? (
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-2xs text-subtle-foreground">
                  {dayjs(startedAt).format("h:mm A")}
                </span>
              </div>
            ) : null}
            {userId ? (
              <UserInitials userId={userId} hideLastSeen size="md" />
            ) : (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-secondary text-xs text-muted-foreground">
                  U
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </AIMessage>
    </m.div>
  );

  // Activity stream isn't copyable message text — only wrap finished turns.
  if (isStreaming) return messageBody;

  return (
    <ChatMessageContextMenu content={content}>
      {messageBody}
    </ChatMessageContextMenu>
  );
}
