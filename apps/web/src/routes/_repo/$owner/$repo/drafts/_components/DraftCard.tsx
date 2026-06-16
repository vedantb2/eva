"use client";

import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import { Badge, Button, cn } from "@conductor/ui";
import { IconTrash } from "@tabler/icons-react";
import { tokenizedToDisplayText } from "@/lib/components/mentions";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import type { DraftCardModel } from "../_utils";

interface DraftCardProps {
  model: DraftCardModel;
  basePath: string;
}

function kindLabel(model: DraftCardModel): string {
  if (model.source === "task") return "Task";
  const { kind, parentCommentId } = model.row;
  if (kind === "taskComment") {
    return parentCommentId ? "Reply" : "Comment";
  }
  if (kind === "sessionChat") return "Session";
  return "Design";
}

function contextTitle(model: DraftCardModel): string {
  if (model.source === "task") {
    return model.row.title || "Untitled";
  }
  return model.row.contextTitle;
}

function snippetText(model: DraftCardModel): string {
  if (model.source === "task") {
    return tokenizedToDisplayText(model.row.description ?? "");
  }
  return tokenizedToDisplayText(model.row.content);
}

function timestamp(model: DraftCardModel): number {
  return model.row.updatedAt;
}

export function DraftCard({ model, basePath }: DraftCardProps) {
  const navigate = useNavigate();
  const removeCommentDraft = useMutation(api.drafts.remove);
  const removeTaskDraft = useMutation(api.agentTasks.remove);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (model.source === "comment") {
      void removeCommentDraft({ id: model.row._id });
    } else {
      void removeTaskDraft({ id: model.row._id });
    }
  };

  const handleClick = () => {
    if (model.source === "task") {
      void navigate({
        to: `${basePath}/quick-tasks`,
        search: { draft: model.row._id },
      });
      return;
    }

    const { kind, taskId, taskProjectId, sessionId, designSessionId } =
      model.row;

    if (kind === "taskComment" && taskId) {
      if (taskProjectId) {
        void navigate({
          to: `${basePath}/projects/${taskProjectId}/${taskId}/activity`,
        });
      } else {
        void navigate({
          to: `${basePath}/quick-tasks/${taskId}/activity`,
        });
      }
    } else if (kind === "sessionChat" && sessionId) {
      void navigate({
        to: `${basePath}/sessions/${sessionId}/preview`,
      });
    } else if (kind === "designChat" && designSessionId) {
      void navigate({
        to: `${basePath}/designs/${designSessionId}`,
      });
    }
  };

  const snippet = snippetText(model);
  const label = kindLabel(model);
  const title = contextTitle(model);
  const ts = timestamp(model);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1.5 rounded-surface border border-border bg-card p-3 shadow-sm",
        "hover:bg-muted/40 transition-colors duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* Header row: badge + timestamp + delete */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="border-none bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {label}
        </Badge>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {title}
        </span>
        <RelativeDateTime at={ts} className="shrink-0 text-xs" />
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          title="Delete draft"
        >
          <IconTrash size={13} />
        </Button>
      </div>

      {/* Snippet */}
      {snippet ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{snippet}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">No content</p>
      )}
    </div>
  );
}
