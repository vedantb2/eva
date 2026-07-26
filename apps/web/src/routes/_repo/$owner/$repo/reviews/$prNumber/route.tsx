import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/reviews/$prNumber")({
  staticData: { title: "Reviews" },
  component: () => <Outlet />,
});
