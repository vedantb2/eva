"use client";

import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";
import {
  getSessionModel,
  getSessionResponseLength,
  useSessionModelSetter,
  useSessionResponseLengthSetter,
} from "@/lib/hooks/useSessionSettings";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  ModelSelect,
  ResponseLengthSelect,
  type PromptInputMessage,
} from "@conductor/ui";
import type { FunctionReturnType } from "convex/server";
import { QueryMessageItem } from "./QueryMessageItem";

type QueryMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

interface QueryConversationProps {
  queryId: Id<"researchQueries">;
  title: string;
  repoId: Id<"githubRepos">;
}

export function QueryConversation({
  queryId,
  title,
  repoId,
}: QueryConversationProps) {
  const messages = useQuery(api.messages.listByParent, { parentId: queryId });
  const streaming = useQuery(api.streaming.get, { entityId: queryId });
  const savedQueries = useQuery(api.savedQueries.list, { repoId });
  const createSavedQuery = useMutation(api.savedQueries.create);
  const [isSending, setIsSending] = useState(false);

  const initialModel = useMemo(
    () => getSessionModel(queryId, "sonnet"),
    [queryId],
  );
  const initialResponseLength = useMemo(
    () => getSessionResponseLength(queryId, "default"),
    [queryId],
  );
  const [model, setModelState] = useState<ClaudeModel>(initialModel);
  const [responseLength, setResponseLengthState] = useState<ResponseLength>(
    initialResponseLength,
  );

  const saveModel = useSessionModelSetter(queryId);
  const saveResponseLength = useSessionResponseLengthSetter(queryId);

  const setModel = useCallback(
    (m: ClaudeModel) => {
      setModelState(m);
      saveModel(m);
    },
    [saveModel],
  );

  const setResponseLength = useCallback(
    (rl: ResponseLength) => {
      setResponseLengthState(rl);
      saveResponseLength(rl);
    },
    [saveResponseLength],
  );

  const updateMessageStatus = useMutation(
    api.researchQueries.updateMessageStatus,
  );
  const startGenerate = useMutation(api.researchQueryWorkflow.startGenerate);
  const startConfirm = useMutation(api.researchQueryWorkflow.startConfirm);

  const messagesList = messages ?? [];

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await startGenerate({
        queryId,
        question: text.trim(),
        repoId,
        model,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = (
    messageId: Id<"messages">,
    queryCode: string,
    question: string,
  ) => {
    startConfirm({
      queryId,
      queryCode,
      messageId,
      question,
      repoId,
    });
  };

  const handleCancel = (messageId: Id<"messages">) => {
    updateMessageStatus({
      id: queryId,
      messageId,
      status: "cancelled",
    });
  };

  const isQuerySaved = (queryCode: string) =>
    savedQueries?.some((sq) => sq.query === queryCode) ?? false;

  const handleSaveQuery = (queryCode: string, question: string) => {
    createSavedQuery({
      repoId,
      title: question,
      query: queryCode,
      researchQueryId: queryId,
    });
  };

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  const getPreviousUserContent = (
    msgs: QueryMessage[],
    currentIndex: number,
  ): string => {
    const prev = currentIndex > 0 ? msgs[currentIndex - 1] : undefined;
    return prev?.content ?? title;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-6 justify-end">
          {messagesList.length === 0 ? (
            <ConversationEmptyState title="No messages yet. Start the conversation!" />
          ) : (
            messagesList.map((message, index) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <QueryMessageItem
                  message={message}
                  previousUserContent={getPreviousUserContent(
                    messagesList,
                    index,
                  )}
                  streamingActivity={streaming?.currentActivity}
                  isSaved={
                    message.queryCode ? isQuerySaved(message.queryCode) : false
                  }
                  onCancel={handleCancel}
                  onConfirm={handleConfirm}
                  onSaveQuery={handleSaveQuery}
                />
              </motion.div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="px-5 pb-4">
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputTextarea
            placeholder="Ask Eva to perform an analysis..."
            disabled={isSending}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelect
                value={model}
                onValueChange={setModel}
                disabled={isSending}
              />
              <ResponseLengthSelect
                value={responseLength}
                onValueChange={setResponseLength}
                disabled={isSending}
              />
            </PromptInputTools>
            <div className="flex items-center gap-1">
              <PromptInputSpeech disabled={isSending} />
              <PromptInputSubmit
                status={isSending ? "submitted" : undefined}
                disabled={isSending}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
