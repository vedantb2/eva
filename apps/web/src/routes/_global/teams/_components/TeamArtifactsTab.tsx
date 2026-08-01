import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { ArtifactList } from "@/lib/components/artifacts/ArtifactList";
import { ArtifactUploadDialog } from "@/lib/components/artifacts/ArtifactUploadDialog";

/** Team detail "Artifacts" tab: artifacts bound to this team, with team-scoped upload. */
export function TeamArtifactsTab({ teamId }: { teamId: Id<"teams"> }) {
  // Left nullable on purpose: `?? []` here would render ArtifactList's empty
  // copy during the fetch, then swap it for real rows.
  const artifacts = useQuery(api.artifacts.listForTeam, { teamId });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Artifacts bound to this team. Anyone in the team can open or delete
          them.
        </p>
        <ArtifactUploadDialog defaultTeamId={teamId} />
      </div>
      {artifacts !== undefined && (
        <ArtifactList
          artifacts={artifacts}
          emptyDescription="Upload a Cowork artifact HTML file to host it for this team."
        />
      )}
    </div>
  );
}
