"use client";

import {
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Spinner,
} from "@conductor/ui";
import { IconUser } from "@tabler/icons-react";
import Image from "next/image";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { UserInitials } from "@conductor/shared";
import type { Id } from "@conductor/backend";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logs?: string;
  isStreaming?: boolean;
  userId?: Id<"users">;
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
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && (
        <div className="mb-1.5 flex items-center gap-2">
          <Avatar className="flex-shrink-0 h-8 w-8 bg-secondary">
            <Image
              src="/icon.png"
              alt="Assistant"
              width={24}
              height={24}
              className="rounded-full"
            />
            <AvatarFallback className="bg-secondary text-muted-foreground">
              E
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-muted-foreground">Eva</span>
        </div>
      )}
      <Card
        className={`shadow-none ${isUser ? "max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-tl-none"}`}
      >
        <CardContent className="py-2 px-2 sm:px-3">
          {isStreaming ? (
            <>
              <pre className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
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
                <Accordion type="single" collapsible className="mt-2 px-0">
                  <AccordionItem value="logs" className="border-b-0">
                    <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                      View logs
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 overflow-hidden">
                      <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground max-h-60 overflow-y-auto w-0 min-w-full">
                        {logs}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <div className="mt-1.5">
          {userId ? (
            <UserInitials userId={userId} hideLastSeen size="md" />
          ) : (
            <Avatar className="flex-shrink-0 h-8 w-8 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <IconUser size={20} />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  );
}
