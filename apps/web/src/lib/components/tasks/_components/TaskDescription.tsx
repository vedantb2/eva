"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FormattedText } from "./FormattedText";

export function TaskDescription({
  description,
  canEditTaskText,
  taskId,
  inline,
}: {
  description: string | undefined;
  canEditTaskText: boolean;
  taskId: Id<"agentTasks">;
  inline: boolean;
}) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const updateTask = useMutation(api.agentTasks.update);

  const raw = description ?? "";
  const separatorIndex = raw.indexOf("---");
  const mainDesc =
    separatorIndex !== -1 ? raw.slice(0, separatorIndex).trimEnd() : raw;
  const elementDetails =
    separatorIndex !== -1 ? raw.slice(separatorIndex + 3).trimStart() : null;

  return (
    <div>
      <div
        onClick={
          !isEditingDescription && canEditTaskText
            ? () => setIsEditingDescription(true)
            : undefined
        }
        title={
          !isEditingDescription && !canEditTaskText
            ? "Description can only be edited in To Do"
            : undefined
        }
        className={`min-h-[1.5rem] overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1 ${inline && !isEditingDescription ? "max-h-[40vh] overflow-y-auto scrollbar" : ""} ${
          isEditingDescription
            ? ""
            : !canEditTaskText
              ? ""
              : "cursor-pointer hover:bg-muted/50"
        }`}
      >
        {!raw && !isEditingDescription ? (
          <p className="text-sm text-muted-foreground italic">
            Click to add description...
          </p>
        ) : (
          <FormattedText
            content={mainDesc}
            editable={isEditingDescription}
            className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap break-words [&_.tiptap]:outline-none [&_.tiptap_p]:my-0 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6"
            onBlur={(markdown) => {
              const trimmed = markdown.trim();
              if (canEditTaskText && trimmed !== description) {
                const fullDesc = elementDetails
                  ? `${trimmed}\n---\n${elementDetails}`
                  : trimmed;
                updateTask({ id: taskId, description: fullDesc });
              }
              setIsEditingDescription(false);
            }}
          />
        )}
      </div>
      {!isEditingDescription && elementDetails && (
        <Accordion type="single" collapsible className="mt-2 px-0">
          <AccordionItem value="element-details">
            <AccordionTrigger>
              <span className="text-xs text-muted-foreground">
                Element Details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <SyntaxHighlighter
                language="css"
                style={oneDark}
                wrapLines
                wrapLongLines
                customStyle={{
                  fontSize: "0.75rem",
                  borderRadius: "0.5rem",
                  margin: 0,
                }}
              >
                {elementDetails}
              </SyntaxHighlighter>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
