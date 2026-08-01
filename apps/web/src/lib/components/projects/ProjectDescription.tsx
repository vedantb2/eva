"use client";

import { useState } from "react";
import { cn } from "@eva/ui";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { MarkdownEditor } from "@/lib/components/tasks/_components/MarkdownEditor";

export function ProjectDescription({
  description,
  projectId,
}: {
  description: string | undefined;
  projectId: Id<"projects">;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProject = useMutation(api.projects.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.projects.get, { id: projectId });
      if (current !== undefined && current !== null) {
        const {
          id: _id,
          priority,
          projectLead,
          codeReviewer,
          model,
          providerAccountId,
          screenshotsVideosEnabled: _screenshotsVideosEnabled,
          runAuditEnabled: _runAuditEnabled,
          ...safeFields
        } = args;
        localStore.setQuery(
          api.projects.get,
          { id: projectId },
          {
            ...current,
            ...safeFields,
            ...(priority !== undefined
              ? { priority: priority ?? undefined }
              : {}),
            ...(projectLead !== undefined
              ? { projectLead: projectLead ?? undefined }
              : {}),
            ...(codeReviewer !== undefined
              ? { codeReviewer: codeReviewer ?? undefined }
              : {}),
            ...(model !== undefined ? { model: model ?? undefined } : {}),
            ...(providerAccountId !== undefined
              ? { providerAccountId: providerAccountId ?? undefined }
              : {}),
          },
        );
      }
    },
  );

  const desc = description ?? "";

  const handleSave = (markdown: string) => {
    const trimmed = markdown.trim();
    if (trimmed !== desc) {
      updateProject({ id: projectId, description: trimmed });
    }
    setIsEditing(false);
  };

  const handleClick = () => {
    if (!isEditing) setIsEditing(true);
  };

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="text-2xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        Project context
      </div>
      <div
        onClick={handleClick}
        title={
          isEditing
            ? undefined
            : "Acts as the project's system prompt for Eva chat and tasks"
        }
        className={cn(
          "min-h-[1.5rem] overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1",
          !isEditing &&
            "max-h-[20vh] overflow-y-auto scrollbar cursor-pointer hover:bg-muted/50",
        )}
      >
        <MarkdownEditor
          content={desc}
          editable={isEditing}
          placeholder="Click to add project context (used as system prompt for Eva chat and tasks)..."
          onBlur={handleSave}
          className="text-sm text-muted-foreground"
        />
      </div>
    </div>
  );
}
