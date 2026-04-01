import { createFileRoute } from "@tanstack/react-router";
import { LogsClient } from "./LogsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/logs")({
  component: LogsClient,
});
