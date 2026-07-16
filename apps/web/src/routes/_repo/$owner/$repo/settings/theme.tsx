import { createFileRoute, redirect } from "@tanstack/react-router";

/** Theme is user-level — send old repo URLs to the global settings page. */
export const Route = createFileRoute("/_repo/$owner/$repo/settings/theme")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/theme" });
  },
});
