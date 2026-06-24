import { createFileRoute } from "@tanstack/react-router";
import { ArtifactViewer } from "@/lib/components/artifacts/ArtifactViewer";

export const Route = createFileRoute("/_global/artifacts/$artifactId")({
  component: ArtifactRoute,
});

function ArtifactRoute() {
  const { artifactId } = Route.useParams();
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col lg:h-[calc(100dvh-3rem)]">
      <ArtifactViewer artifactId={artifactId} />
    </div>
  );
}
