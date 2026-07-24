"use client";

import type { FunctionReturnType } from "convex/server";
import { type api } from "@eva/backend";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { ArtifactCard } from "./ArtifactCard";

type ArtifactRow = FunctionReturnType<typeof api.artifacts.listAll>[number];

/** Responsive grid of artifact tiles, or an empty state. */
export function ArtifactList({
  artifacts,
  emptyDescription,
}: {
  artifacts: ArtifactRow[];
  emptyDescription: string;
}) {
  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={
          <IconLayoutDashboard size={24} className="text-muted-foreground" />
        }
        title="No artifacts yet"
        description={emptyDescription}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact._id} artifact={artifact} />
      ))}
    </div>
  );
}
