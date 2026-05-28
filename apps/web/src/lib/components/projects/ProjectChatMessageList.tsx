"use client";

import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import type { ConversationMessage } from "./ProjectChatTab";
import {
  isParsedQuestion,
  isInterviewTransitionContent,
  isSpecContent,
  mergePriorAssistantActivityLogs,
} from "./projectChatMessage.utils";

interface ProjectChatMessageListProps {
  messages: ConversationMessage[];
  streamingActivity?: string;
}

const evaIcon = (
  <img
    src="/icon.svg"
    alt="Eva"
    width={20}
    height={20}
    className="rounded-full outline outline-1 outline-black/10 dark:outline-white/10"
  />
);

export function ProjectChatMessageList({
  messages,
  streamingActivity,
}: ProjectChatMessageListProps) {
  return (
    <>
      {messages.map((m, i) => {
        if (m.role === "assistant") {
          if (!m.content) {
            return (
              <div key={`msg-${i}`} className="px-1 py-2">
                <StreamingActivityDisplay
                  activity={streamingActivity}
                  startedAt={m.startedAt}
                />
              </div>
            );
          }
          if (isInterviewTransitionContent(m.content)) {
            const specFollows = messages
              .slice(i + 1)
              .some((n) => n.role === "assistant" && isSpecContent(n.content));
            if (specFollows) {
              return null;
            }
            if (!m.activityLog) {
              return null;
            }
            return (
              <div key={`msg-${i}`} className="px-1 py-2">
                <ActivityLogDisplay
                  activityLog={m.activityLog}
                  name="Eva"
                  icon={evaIcon}
                  startedAt={m.startedAt}
                  finishedAt={m.finishedAt}
                />
              </div>
            );
          }
          try {
            const parsed: unknown = JSON.parse(m.content);
            if (isParsedQuestion(parsed)) {
              return (
                <ChatMessage
                  key={`msg-${i}`}
                  role="assistant"
                  content={parsed.question}
                  logs={m.activityLog}
                  startedAt={m.startedAt}
                  finishedAt={m.finishedAt}
                />
              );
            }
            if (isSpecContent(m.content)) {
              const specParsed: unknown = JSON.parse(m.content);
              const title =
                typeof specParsed === "object" &&
                specParsed !== null &&
                "title" in specParsed &&
                typeof specParsed.title === "string"
                  ? specParsed.title
                  : "Untitled plan";
              const taskCount =
                typeof specParsed === "object" &&
                specParsed !== null &&
                "tasks" in specParsed &&
                Array.isArray(specParsed.tasks)
                  ? specParsed.tasks.length
                  : 0;
              const mergedLogs = [
                mergePriorAssistantActivityLogs(messages, i),
                m.activityLog,
              ]
                .filter(Boolean)
                .join("\n\n");
              return (
                <ChatMessage
                  key={`msg-${i}`}
                  role="assistant"
                  content={`Plan ready: ${title} (${taskCount} ${taskCount === 1 ? "task" : "tasks"})`}
                  logs={mergedLogs || undefined}
                  startedAt={m.startedAt}
                  finishedAt={m.finishedAt}
                />
              );
            }
          } catch {
            // Not parseable JSON
          }
          return (
            <ChatMessage
              key={`msg-${i}`}
              role="assistant"
              content={m.content}
              logs={m.activityLog}
              startedAt={m.startedAt}
              finishedAt={m.finishedAt}
            />
          );
        }
        return (
          <ChatMessage
            key={`msg-${i}`}
            role="user"
            content={m.content}
            userId={m.userId}
            startedAt={m.startedAt}
          />
        );
      })}
    </>
  );
}
