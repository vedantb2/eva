import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_global/teams/$teamId")({
  staticData: { title: "Teams" },
  component: () => <Outlet />,
});
