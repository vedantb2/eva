"use client";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@eva/ui";
import {
  IconExternalLink,
  IconLayoutDashboard,
  IconTrash,
} from "@tabler/icons-react";
import { relativeTime } from "./_format";

type ArtifactRow = FunctionReturnType<typeof api.artifacts.listAll>[number];

/** A single artifact tile: left-click opens the viewer; right-click for actions. */
export function ArtifactCard({ artifact }: { artifact: ArtifactRow }) {
  const navigate = useNavigate();
  const remove = useMutation(api.artifacts.remove);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const openInNewTab = () =>
    window.open(`/artifacts/${artifact._id}`, "_blank", "noopener");

  const onDelete = async () => {
    await remove({ id: artifact._id });
    setConfirmDeleteOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            to="/artifacts/$artifactId"
            params={{ artifactId: artifact._id }}
            className="flex flex-col gap-2 rounded-surface bg-card p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <IconLayoutDashboard
                size={18}
                className="shrink-0 text-muted-foreground"
              />
              <span className="truncate font-medium text-foreground">
                {artifact.name}
              </span>
            </div>
            {artifact.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {artifact.description}
              </p>
            ) : null}
            <span className="mt-auto text-xs text-muted-foreground">
              {relativeTime(artifact.createdAt)}
            </span>
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() =>
              navigate({
                to: "/artifacts/$artifactId",
                params: { artifactId: artifact._id },
              })
            }
          >
            <IconLayoutDashboard size={16} />
            Open
          </ContextMenuItem>
          <ContextMenuItem onClick={openInNewTab}>
            <IconExternalLink size={16} />
            Open in new tab
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <IconTrash size={16} />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &quot;{artifact.name}&quot;?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
