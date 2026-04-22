"use client";

import { lazy, Suspense, useState, useCallback } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Spinner,
  cn,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { MarkdownEditor } from "./MarkdownEditor";

const LazyCodeBlock = lazy(() =>
  import("./LazyCodeBlock").then((m) => ({ default: m.CodeBlock })),
);

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
  const [isEditing, setIsEditing] = useState(false);
  const updateTask = useMutation(api.agentTasks.update);

  const raw = description ?? "";
  const separatorIndex = raw.indexOf("---");
  const mainDesc =
    separatorIndex !== -1 ? raw.slice(0, separatorIndex).trimEnd() : raw;
  const elementDetails =
    separatorIndex !== -1 ? raw.slice(separatorIndex + 3).trimStart() : null;

  const handleSave = useCallback(
    (markdown: string) => {
      const trimmed = markdown.trim();
      if (canEditTaskText && trimmed !== mainDesc) {
        const fullDesc = elementDetails
          ? `${trimmed}\n---\n${elementDetails}`
          : trimmed;
        updateTask({ id: taskId, description: fullDesc });
      }
      setIsEditing(false);
    },
    [canEditTaskText, mainDesc, elementDetails, taskId, updateTask],
  );

  const handleClick = useCallback(() => {
    if (!isEditing && canEditTaskText) {
      setIsEditing(true);
    }
  }, [isEditing, canEditTaskText]);

  return (
    <div>
      <div
        onClick={handleClick}
        title={
          !isEditing && !canEditTaskText
            ? "Description can only be edited in To Do"
            : undefined
        }
        className={cn(
          "min-h-[1.5rem] overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1",
          inline && !isEditing && "max-h-[40vh] overflow-y-auto scrollbar",
          !isEditing && canEditTaskText && "cursor-pointer hover:bg-muted/50",
        )}
      >
        <MarkdownEditor
          content={mainDesc}
          editable={isEditing}
          placeholder={
            canEditTaskText ? "Click to add description..." : undefined
          }
          onBlur={handleSave}
          className="text-sm text-muted-foreground"
        />
      </div>
      {!isEditing && elementDetails && (
        <Accordion type="single" collapsible className="mt-2 px-0">
          <AccordionItem value="element-details">
            <AccordionTrigger>
              <span className="text-xs text-muted-foreground">
                Element Details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Suspense fallback={<Spinner size="sm" />}>
                <LazyCodeBlock code={elementDetails} language="css" />
              </Suspense>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
