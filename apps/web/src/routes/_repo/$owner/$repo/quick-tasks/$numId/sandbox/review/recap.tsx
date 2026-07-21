import { createFileRoute } from "@tanstack/react-router";

/** Matched for params; parent quick-tasks layout renders the task. */
export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/review/recap",
)({
  component: () => null,
});
