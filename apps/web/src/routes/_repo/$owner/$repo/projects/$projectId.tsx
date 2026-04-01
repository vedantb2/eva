import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailClient } from "./ProjectDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/projects/$projectId")(
  {
    component: ProjectDetailClient,
  },
);
