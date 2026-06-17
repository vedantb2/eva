"use client";

import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { IconLayoutDashboard, IconTrash } from "@tabler/icons-react";

type ArtifactRow = FunctionReturnType<typeof api.artifacts.listAll>[number];

/** A single artifact tile: opens the viewer on click; trash button deletes it. */
export function ArtifactCard({ artifact }: { artifact: ArtifactRow }) {
  const remove = useMutation(api.artifacts.remove);

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${artifact.name}"? This cannot be undone.`)) {
      return;
    }
    await remove({ id: artifact._id });
  };

  return (
    <Link
      to="/artifacts/$artifactId"
      params={{ artifactId: artifact._id }}
      className="group relative flex flex-col gap-2 rounded-surface border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconLayoutDashboard
            size={18}
            className="shrink-0 text-muted-foreground"
          />
          <span className="truncate font-medium text-foreground">
            {artifact.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete artifact"
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <IconTrash size={15} />
        </button>
      </div>
      {artifact.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {artifact.description}
        </p>
      ) : null}
      <span className="mt-auto text-xs text-muted-foreground">
        {new Date(artifact.createdAt).toLocaleDateString()}
      </span>
    </Link>
  );
}
