import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_global/teams/$teamId")({
  component: () => <Outlet />,
});
