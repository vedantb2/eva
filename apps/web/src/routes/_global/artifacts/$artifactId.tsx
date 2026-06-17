import { createFileRoute } from "@tanstack/react-router";
import { ArtifactViewer } from "@/lib/components/artifacts/ArtifactViewer";

export const Route = createFileRoute("/_global/artifacts/$artifactId")({
  component: ArtifactRoute,
});

function ArtifactRoute() {
  const { artifactId } = Route.useParams();
  return <ArtifactViewer artifactId={artifactId} />;
}
