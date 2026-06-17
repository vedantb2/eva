import { createFileRoute } from "@tanstack/react-router";
import { ArtifactsGlobalClient } from "./ArtifactsGlobalClient";

export const Route = createFileRoute("/_global/artifacts/")({
  component: ArtifactsGlobalClient,
});
