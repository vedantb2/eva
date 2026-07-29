import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/snapshots")({
  staticData: { title: "Settings" },
  component: () => <Outlet />,
});
