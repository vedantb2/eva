import { createFileRoute } from "@tanstack/react-router";
import { QuickTaskDetailClient } from "./QuickTaskDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/quick-tasks/$taskId")(
  {
    component: QuickTaskDetailClient,
  },
);
