"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { IconArrowUp, IconUser } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";

interface QueryDetailClientProps {
  queryId: string;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const { repo } = useRepo();
  const typedQueryId = queryId as Id<"researchQueries">;
  const query = useQuery(api.researchQueries.get, { id: typedQueryId });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "research/query.execute",
          data: {
            queryId: typedQueryId,
            question: content,
            repoId: repo._id,
          },
        }),
      });
    } finally {
      setIsSending(false);
    }
  };

  if (query === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (query === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-neutral-500">
            This query does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-[16px] border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {query.title}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar p-6 space-y-4">
        {query.messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          query.messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src="/icon.png"
                    alt="Assistant"
                    width={32}
                    height={32}
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl ${
                  message.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              {message.role === "user" &&
                (message.userId ? (
                  <UserInitials userId={message.userId} hideLastSeen size="md" />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <IconUser className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </div>
                ))}
            </div>
          ))
        )}
        {isSending && (
          <div className="flex gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
            <span className="text-sm text-neutral-500">Sending...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-5 pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex gap-2 items-end bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Eva to perform an analysis..."
              minRows={4}
              maxRows={6}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
              classNames={{
                inputWrapper:
                  "bg-neutral-100 hover:bg-neutral-200  dark:bg-neutral-800 dark:hover:bg-neutral-700",
              }}
              isDisabled={isSending}
            />
            <Button
              type="submit"
              isIconOnly
              color="primary"
              className="mb-auto mr-2 mt-2"
              isLoading={isSending}
              isDisabled={isSending || !input.trim()}
            >
              <IconArrowUp size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
