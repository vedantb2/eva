import { createFileRoute } from "@tanstack/react-router";
import { RepoHomeClient } from "./RepoHomeClient";

export const Route = createFileRoute("/_repo/$owner/$repo/")({
  component: RepoHomeClient,
});
