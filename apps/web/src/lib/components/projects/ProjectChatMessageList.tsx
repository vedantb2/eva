import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import type { ProjectInterviewProjection } from "./projectChatMessage.utils";

interface ProjectChatMessageListProps {
  projection: ProjectInterviewProjection;
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
  projection,
  streamingActivity,
}: ProjectChatMessageListProps) {
  return (
    <>
      {projection.rows.map((row) => {
        if (row.kind === "streaming") {
          return (
            <div key={row.id} className="px-1 py-2">
              <StreamingActivityDisplay
                activity={streamingActivity}
                startedAt={row.startedAt}
              />
            </div>
          );
        }
        if (row.kind === "transition") {
          if (!row.activityLog) return null;
          return (
            <div key={row.id} className="px-1 py-2">
              <ActivityLogDisplay
                activityLog={row.activityLog}
                name="Eva"
                icon={evaIcon}
                startedAt={row.startedAt}
                finishedAt={row.finishedAt}
              />
            </div>
          );
        }
        if (row.kind === "question") {
          return (
            <ChatMessage
              key={row.id}
              role="assistant"
              content={row.question.question}
              logs={row.activityLog}
              startedAt={row.startedAt}
              finishedAt={row.finishedAt}
            />
          );
        }
        if (row.kind === "spec") {
          return (
            <ChatMessage
              key={row.id}
              role="assistant"
              content={`Plan ready: ${row.title} (${row.taskCount} ${row.taskCount === 1 ? "task" : "tasks"})`}
              logs={row.activityLog}
              startedAt={row.startedAt}
              finishedAt={row.finishedAt}
            />
          );
        }
        return (
          <ChatMessage
            key={row.id}
            role={row.role}
            content={row.content}
            logs={row.activityLog}
            userId={row.userId}
            startedAt={row.startedAt}
            finishedAt={row.finishedAt}
          />
        );
      })}
    </>
  );
}
