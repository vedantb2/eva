"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ArtifactList } from "@/lib/components/artifacts/ArtifactList";
import { ArtifactUploadDialog } from "@/lib/components/artifacts/ArtifactUploadDialog";

/** Global Artifacts page: every artifact across the teams the user belongs to. */
export function ArtifactsGlobalClient() {
  const artifacts = useQuery(api.artifacts.listAll);

  if (artifacts === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <PageWrapper title="Artifacts" comfortable>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Hosted dashboards that read live data through the Eva connector.
        </p>
        <ArtifactUploadDialog />
      </div>
      <ArtifactList
        artifacts={artifacts}
        emptyDescription="Upload a Cowork artifact HTML file to host it here. It runs live against the Eva MCP read-only tools."
      />
    </PageWrapper>
  );
}
