"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ArtifactList } from "@/lib/components/artifacts/ArtifactList";
import { ArtifactUploadDialog } from "@/lib/components/artifacts/ArtifactUploadDialog";

/** Global Artifacts page: every artifact across the teams the user belongs to. */
export function ArtifactsGlobalClient() {
  const artifacts = useQuery(api.artifacts.listAll);

  return (
    <PageWrapper title="Artifacts" comfortable>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Hosted dashboards that read live data through the Eva connector.
        </p>
        <ArtifactUploadDialog />
      </div>
      {artifacts === undefined ? (
        <div
          className="grid min-h-[20rem] gap-3 sm:grid-cols-2"
          aria-busy="true"
          aria-label="Loading artifacts"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-surface border border-border bg-muted/60"
            />
          ))}
        </div>
      ) : (
        <ArtifactList
          artifacts={artifacts}
          emptyDescription="Upload a Cowork artifact HTML file to host it here. It runs live against the Eva MCP read-only tools."
        />
      )}
    </PageWrapper>
  );
}
