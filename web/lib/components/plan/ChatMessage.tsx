"use client";

import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Spinner } from "@heroui/spinner";
import { IconUser } from "@tabler/icons-react";
import Image from "next/image";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { UserInitials } from "@/lib/components/ui/UserInitials";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logs?: string;
  isStreaming?: boolean;
  userId?: string;
}

export function ChatMessage({
  role,
  content,
  logs,
  isStreaming,
  userId,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser && userId ? (
        <div className="flex-shrink-0">
          <UserInitials userId={userId} hideLastSeen size="md" />
        </div>
      ) : (
        <Avatar
          icon={
            isUser ? (
              <IconUser size={20} />
            ) : (
              <Image
                src="/icon.png"
                alt="Assistant"
                width={24}
                height={24}
                className="rounded-full"
              />
            )
          }
          classNames={{
            base: isUser ? "bg-primary" : "bg-neutral-200",
            icon: isUser ? "text-primary-foreground" : "text-default-600",
          }}
          className="flex-shrink-0"
          size="sm"
        />
      )}
      <Card
        shadow="none"
        className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "bg-primary text-primary-foreground" : "bg-default-100"}`}
      >
        <CardBody className="py-2 px-2 sm:px-3">
          {isStreaming ? (
            <>
              <pre className="text-sm whitespace-pre-wrap break-words text-default-500">
                {content}
              </pre>
              <Spinner size="sm" className="mt-2" />
            </>
          ) : (
            <>
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {content}
                </p>
              ) : (
                <Streamdown
                  plugins={{ code }}
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  {content}
                </Streamdown>
              )}
              {logs && (
                <Accordion isCompact className="mt-2 px-0">
                  <AccordionItem
                    key="logs"
                    title="View logs"
                    classNames={{
                      trigger: "py-1",
                      title: "text-xs text-default-400",
                      content: "pt-0 overflow-hidden",
                    }}
                  >
                    <pre className="text-xs whitespace-pre-wrap break-all text-default-500 max-h-60 overflow-y-auto w-0 min-w-full">
                      {logs}
                    </pre>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
