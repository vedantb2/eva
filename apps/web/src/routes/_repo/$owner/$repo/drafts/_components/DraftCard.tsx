"use client";

import { useMutation, useConvex } from "convex/react";
import type { ConvexReactClient } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  Badge,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ListRow,
} from "@eva/ui";
import { IconTrash } from "@tabler/icons-react";
import { tokenizedToDisplayText } from "@/lib/components/mentions";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { entityPathSegment } from "@/lib/numId";
import type { DraftCardModel } from "../_utils";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

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
  if (kind === "projectChat") return "Project chat";
  if (kind === "sessionChat") return "Session";
  return "Draft";
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

/**
 * One draft as a dense list row: what kind of draft it is, the surface it
 * belongs to, and the first couple of lines of what was written. Clicking a row
 * reopens that surface; right-clicking discards the draft.
 */
export function DraftCard({ model, basePath }: DraftCardProps) {
  const navigate = useNavigate();
  const convex = useConvex();
  const removeCommentDraft = useMutation(api.drafts.remove);
  const removeTaskDraft = useMutation(api.agentTasks.remove);

  const handleDelete = () => {
    if (model.source === "comment") {
      void removeCommentDraft({ id: model.row._id });
    } else {
      void removeTaskDraft({ id: model.row._id });
    }
  };

  const handleClick = () => {
    if (model.source === "task") {
      void navigate({
        to: toInternalRepoHref(`${basePath}/quick-tasks`),
        search: { draft: model.row._id },
      });
      return;
    }

    const { kind, taskId, taskProjectId, projectId, sessionId } = model.row;

    if (kind === "taskComment" && taskId) {
      void (async () => {
        const path = await resolveTaskActivityPath(
          convex,
          basePath,
          taskId,
          taskProjectId,
        );
        if (path) {
          await navigate({ to: toInternalRepoHref(path) });
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
          await navigate({ to: toInternalRepoHref(path) });
        }
      })();
      return;
    }

    if (kind === "projectChat" && projectId) {
      void (async () => {
        const project = await convex.query(api.projects.get, { id: projectId });
        const segment = project ? entityPathSegment(project) : null;
        if (!segment) {
          return;
        }
        await navigate({
          to: toInternalRepoHref(
            `${basePath}/projects/${segment}/sandbox/preview`,
          ),
        });
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
        await navigate({
          to: toInternalRepoHref(`${basePath}/sessions/${segment}/preview`),
        });
      })();
      return;
    }
  };

  const snippet = snippetText(model);
  const label = kindLabel(model);
  const title = contextTitle(model);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <ListRow
          density="compact"
          onClick={handleClick}
          aria-label={title}
          contentClassName="flex flex-col gap-1"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="quiet" className="shrink-0 px-1.5 font-medium">
              {label}
            </Badge>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {title}
            </span>
            <RelativeDateTime
              at={model.row.updatedAt}
              className="shrink-0 text-2xs"
            />
          </div>

          {snippet ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {snippet}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground/60">
              No content
            </p>
          )}
        </ListRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="text-destructive" onClick={handleDelete}>
          <IconTrash size={16} />
          Delete draft
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
