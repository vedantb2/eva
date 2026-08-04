import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Sessions mount only the active route tree; durable state lives in Convex/URL. */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions")({
  staticData: { title: "Sessions" },
  component: SessionsLayout,
});

function SessionsLayout() {
  return (
    <div className="h-full min-h-0">
      <Outlet />
    </div>
  );
}
