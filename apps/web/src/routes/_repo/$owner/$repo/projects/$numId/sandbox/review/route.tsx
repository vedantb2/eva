import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox/review",
)({
  component: () => <Outlet />,
});
