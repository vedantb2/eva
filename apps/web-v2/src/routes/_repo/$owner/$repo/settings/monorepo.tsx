import { createFileRoute } from "@tanstack/react-router";
import { MonorepoClient } from "./MonorepoClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/monorepo")({
  component: MonorepoClient,
});
