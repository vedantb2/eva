"use client";

import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar
        icon={isUser ? <User size={20} /> : <Bot size={20} />}
        classNames={{
          base: isUser ? "bg-primary" : "bg-default-200",
          icon: isUser ? "text-primary-foreground" : "text-default-600",
        }}
        size="sm"
      />
      <Card
        className={`max-w-[80%] ${isUser ? "bg-primary text-primary-foreground" : "bg-default-100"}`}
      >
        <CardBody className="py-2 px-3">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </CardBody>
      </Card>
    </div>
  );
}
