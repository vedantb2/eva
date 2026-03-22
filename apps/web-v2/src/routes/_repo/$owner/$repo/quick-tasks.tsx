import { createFileRoute } from "@tanstack/react-router";
import { QuickTasksClient } from "./quick-tasks/QuickTasksClient";

export const Route = createFileRoute("/_repo/$owner/$repo/quick-tasks")({
  component: QuickTasksClient,
});
