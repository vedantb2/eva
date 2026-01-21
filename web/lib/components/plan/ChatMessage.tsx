"use client";

import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { IconUser } from "@tabler/icons-react";
import Image from "next/image";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar
        icon={isUser ? <IconUser size={20} /> : <Image src="/icon.png" alt="Assistant" width={20} height={20} />}
        classNames={{
          base: isUser ? "bg-primary" : "bg-default-200",
          icon: isUser ? "text-primary-foreground" : "text-default-600",
        }}
        size="sm"
        className="flex-shrink-0"
      />
      <Card
        shadow="none"
        className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "bg-primary text-primary-foreground" : "bg-default-100"}`}
      >
        <CardBody className="py-2 px-2 sm:px-3">
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </CardBody>
      </Card>
    </div>
  );
}
