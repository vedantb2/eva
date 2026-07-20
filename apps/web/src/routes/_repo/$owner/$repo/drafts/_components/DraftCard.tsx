"use client";

import { useMutation, useConvex } from "convex/react";
import type { ConvexReactClient } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Badge, Button, cn } from "@conductor/ui";
import { IconTrash } from "@tabler/icons-react";
import { tokenizedToDisplayText } from "@/lib/components/mentions";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { entityPathSegment } from "@/lib/numId";
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
  if (kind === "taskChat") return "Task chat";
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

async function resolveTaskActivityPath(
  convex: ConvexReactClient,
  basePath: string,
  taskId: Id<"agentTasks">,
  taskProjectId: Id<"projects"> | undefined,
): Promise<string | null> {
  const task = await convex.query(api.agentTasks.get, { id: taskId });
  const taskSegment = task ? entityPathSegment(task) : null;
  if (!taskSegment) {
    return null;
  }
  if (taskProjectId) {
    const project = await convex.query(api.projects.get, { id: taskProjectId });
    const projectSegment = project ? entityPathSegment(project) : null;
    if (!projectSegment) {
      return null;
    }
    return `${basePath}/projects/${projectSegment}/${taskSegment}/activity`;
  }
  return `${basePath}/quick-tasks/${taskSegment}`;
}

/** Opens the surface where the task sandbox chat draft was written. */
async function resolveTaskChatPath(
  convex: ConvexReactClient,
  basePath: string,
  taskId: Id<"agentTasks">,
  taskProjectId: Id<"projects"> | undefined,
): Promise<string | null> {
  const root = await resolveTaskActivityPath(
    convex,
    basePath,
    taskId,
    taskProjectId,
  );
  if (!root) return null;
  // Quick tasks have a dedicated sandbox route; project tasks embed sandbox
  // in the detail layout, so land on activity.
  if (taskProjectId) return root;
  return `${root}/sandbox/preview`;
}

export function DraftCard({ model, basePath }: DraftCardProps) {
  const navigate = useNavigate();
  const convex = useConvex();
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
      void (async () => {
        const path = await resolveTaskActivityPath(
          convex,
          basePath,
          taskId,
          taskProjectId,
        );
        if (path) {
          await navigate({ to: path });
        }
      })();
      return;
    }

    if (kind === "taskChat" && taskId) {
      void (async () => {
        const path = await resolveTaskChatPath(
          convex,
          basePath,
          taskId,
          taskProjectId,
        );
        if (path) {
          await navigate({ to: path });
        }
      })();
      return;
    }

    if (kind === "sessionChat" && sessionId) {
      void (async () => {
        const session = await convex.query(api.sessions.get, { id: sessionId });
        const segment = session ? entityPathSegment(session) : null;
        if (!segment) {
          return;
        }
        await navigate({ to: `${basePath}/sessions/${segment}/preview` });
      })();
      return;
    }

    if (kind === "designChat" && designSessionId) {
      void (async () => {
        const designSession = await convex.query(api.designSessions.get, {
          id: designSessionId,
        });
        const segment = designSession ? entityPathSegment(designSession) : null;
        if (!segment) {
          return;
        }
        await navigate({ to: `${basePath}/designs/${segment}` });
      })();
    }
  };

  const snippet = snippetText(model);
  const label = kindLabel(model);
  const title = contextTitle(model);
  const ts = model.row.updatedAt;

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
