"use client";

import { useState } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconMessage } from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlanContextPanelProps {
  generatedSpec: string;
  conversationHistory: ConversationMessage[];
}

export function PlanContextPanel({
  generatedSpec,
  conversationHistory,
}: PlanContextPanelProps) {
  const parsedSpec = (() => {
    try {
      return parseSpec(generatedSpec);
    } catch {
      return null;
    }
  })();

  if (!parsedSpec) {
    return null;
  }

  return (
    <div className="max-h-64 overflow-auto">
      <Accordion selectionMode="multiple" className="px-2">
        <AccordionItem
          key="spec"
          title={
            <div className="flex items-center gap-2 text-sm">
              <IconFileText size={14} />
              <span>Plan</span>
            </div>
          }
          classNames={{ content: "text-xs" }}
        >
          <div className="space-y-2">
            <p className="font-medium">{parsedSpec.title}</p>
            <p className="text-default-500">{parsedSpec.description}</p>
            <div className="space-y-1">
              {parsedSpec.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-default-400 font-mono">{i + 1}.</span>
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </AccordionItem>
        <AccordionItem
          key="conversation"
          title={
            <div className="flex items-center gap-2 text-sm">
              <IconMessage size={14} />
              <span>Interview ({conversationHistory.length} messages)</span>
            </div>
          }
          classNames={{ content: "text-xs" }}
        >
          <div className="space-y-2 max-h-48 overflow-auto">
            {conversationHistory.map((msg, i) => {
              let displayContent = msg.content;
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed.question) {
                  displayContent = `Q: ${parsed.question}`;
                } else if (parsed.title) {
                  displayContent = `Generated: ${parsed.title}`;
                }
              } catch {
                // Keep original content
              }
              return (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    msg.role === "user"
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : "bg-default-100"
                  }`}
                >
                  <span className="text-default-400 text-[10px] uppercase">
                    {msg.role}
                  </span>
                  <p className="line-clamp-2">{displayContent}</p>
                </div>
              );
            })}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
