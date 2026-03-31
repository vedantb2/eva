import { createFileRoute } from "@tanstack/react-router";
import { QuickTasksClient } from "./QuickTasksClient";

export const Route = createFileRoute("/_repo/$owner/$repo/quick-tasks/")({
  component: QuickTasksClient,
});
