import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/review/diffs",
)({
  component: () => <Outlet />,
});
