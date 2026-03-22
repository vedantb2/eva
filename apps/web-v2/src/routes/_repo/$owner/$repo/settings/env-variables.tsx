import { createFileRoute } from "@tanstack/react-router";
import { EnvVariablesPageClient } from "./EnvVariablesPageClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/env-variables",
)({
  component: EnvVariablesPageClient,
});
