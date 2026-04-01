import { createFileRoute } from "@tanstack/react-router";
import { ConfigClient } from "./ConfigClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/config")({
  component: ConfigClient,
});
