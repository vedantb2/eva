import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/projects/$numId")({
  staticData: { title: "Projects" },
  component: () => <Outlet />,
});
