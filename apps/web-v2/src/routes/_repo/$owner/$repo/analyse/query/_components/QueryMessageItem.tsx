import type { Id } from "@conductor/backend";
import {
  IconCheck,
  IconX,
  IconBookmark,
  IconBookmarkFilled,
} from "@tabler/icons-react";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { EvaIcon } from "@/lib/components/EvaIcon";
import {
  Button,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
  CodeBlock,
  CodeBlockCopyButton,
  Sandbox,
  SandboxContent,
  SandboxTabs,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTabContent,
  ActivitySteps,
} from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type QueryMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

interface QueryMessageItemProps {
  message: QueryMessage;
  previousUserContent: string;
  streamingActivity: string | undefined;
  isSaved: boolean;
  onCancel: (messageId: Id<"messages">) => void;
  onConfirm: (
    messageId: Id<"messages">,
    queryCode: string,
    question: string,
  ) => void;
  onSaveQuery: (queryCode: string, question: string) => void;
}

export function QueryMessageItem({
  message,
  previousUserContent,
  streamingActivity,
  isSaved,
  onCancel,
  onConfirm,
  onSaveQuery,
}: QueryMessageItemProps) {
  return (
    <AIMessage from={message.role}>
      {message.role === "assistant" && (
        <div className="flex items-center gap-2">
          <EvaIcon size={32} />
          <span className="text-xs font-medium text-muted-foreground">Eva</span>
        </div>
      )}
      <MessageContent
        className={
          message.role === "user"
            ? "rounded-xl bg-secondary text-foreground px-4 py-3"
            : "px-1 py-2"
        }
      >
        {message.role === "assistant" && !message.content ? (
          <StreamingActivityDisplay
            activity={streamingActivity}
            thinkingLabel="Analysing..."
          />
        ) : message.role === "assistant" && message.status === "pending" ? (
          <>
            <Confirmation state="pending">
              <ConfirmationTitle>
                <p className="text-xs font-medium text-muted-foreground">
                  Generated query:
                </p>
              </ConfirmationTitle>
              <ConfirmationRequest>
                <CodeBlock code={message.content} language="typescript">
                  <CodeBlockCopyButton />
                  <pre className="overflow-x-auto p-3 text-xs">
                    <code>{message.content}</code>
                  </pre>
                </CodeBlock>
              </ConfirmationRequest>
              <ConfirmationActions>
                <ConfirmationAction
                  variant="outline"
                  onClick={() => onCancel(message._id)}
                >
                  <IconX size={14} />
                  Cancel
                </ConfirmationAction>
                <ConfirmationAction
                  onClick={() =>
                    onConfirm(message._id, message.content, previousUserContent)
                  }
                >
                  <IconCheck size={14} />
                  Run query
                </ConfirmationAction>
              </ConfirmationActions>
            </Confirmation>
            {message.activityLog &&
              (() => {
                const steps = parseActivitySteps(message.activityLog);
                return steps ? (
                  <details className="mt-2 group">
                    <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
                      Generation logs
                    </summary>
                    <div className="mt-2">
                      <ActivitySteps steps={steps} />
                    </div>
                  </details>
                ) : null;
              })()}
          </>
        ) : message.role === "assistant" && message.status === "cancelled" ? (
          <Confirmation state="rejected">
            <ConfirmationRejected>
              <p className="text-sm text-muted-foreground italic">
                Query cancelled
              </p>
            </ConfirmationRejected>
          </Confirmation>
        ) : message.role === "assistant" ? (
          message.queryCode ? (
            <Sandbox state="completed">
              <SandboxContent>
                <SandboxTabs defaultValue="output">
                  <SandboxTabsList>
                    <SandboxTabsTrigger value="output">
                      Output
                    </SandboxTabsTrigger>
                    <SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
                    {message.activityLog && (
                      <SandboxTabsTrigger value="logs">Logs</SandboxTabsTrigger>
                    )}
                  </SandboxTabsList>
                  <SandboxTabContent value="output">
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </MessageResponse>
                  </SandboxTabContent>
                  <SandboxTabContent value="code">
                    <CodeBlock code={message.queryCode} language="typescript">
                      <CodeBlockCopyButton />
                      <pre className="overflow-x-auto p-3 text-xs">
                        <code>{message.queryCode}</code>
                      </pre>
                    </CodeBlock>
                    <div className="mt-2">
                      {isSaved ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <IconBookmarkFilled size={14} />
                          <span>Saved</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onSaveQuery(
                              message.queryCode ?? "",
                              previousUserContent,
                            )
                          }
                        >
                          <IconBookmark size={14} />
                          Save query
                        </Button>
                      )}
                    </div>
                  </SandboxTabContent>
                  {message.activityLog && (
                    <SandboxTabContent value="logs">
                      <div className="p-3">
                        <ActivitySteps
                          steps={parseActivitySteps(message.activityLog) ?? []}
                        />
                      </div>
                    </SandboxTabContent>
                  )}
                </SandboxTabs>
              </SandboxContent>
            </Sandbox>
          ) : (
            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
              {message.content}
            </MessageResponse>
          )
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </MessageContent>
      {message.role === "user" && (
        <div className="mt-0.5 ml-auto">
          <UserMessageAvatar userId={message.userId} className="h-8 w-8" />
        </div>
      )}
    </AIMessage>
  );
}
