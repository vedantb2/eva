import { createFileRoute } from "@tanstack/react-router";
import { AppClient } from "./AppClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/app")({
  component: AppClient,
});
