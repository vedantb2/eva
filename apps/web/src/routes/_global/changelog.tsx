import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The page moved to `/whats-new`. Kept as a redirect because `/changelog` has
 * been shared as a link, and the weekly automation's emails point at it.
 */
export const Route = createFileRoute("/_global/changelog")({
  beforeLoad: () => {
    throw redirect({ to: "/whats-new", replace: true });
  },
});
