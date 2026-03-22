import { createFileRoute } from "@tanstack/react-router";
import { ProjectsClient } from "./ProjectsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/projects/")({
  component: ProjectsClient,
});
