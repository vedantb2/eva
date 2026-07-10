import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/testing-arena/$numId",
)({
  component: () => <Outlet />,
});
