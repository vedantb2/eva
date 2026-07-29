import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/testing-arena/$numId",
)({
  staticData: { title: "Testing Arena" },
  component: () => <Outlet />,
});
