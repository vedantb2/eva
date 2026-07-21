import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Legacy `/pr` tree — child routes redirect to `/review`. */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId/pr")({
  component: () => <Outlet />,
});
