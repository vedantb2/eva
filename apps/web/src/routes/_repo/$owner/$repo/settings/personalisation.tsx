import { createFileRoute, redirect } from "@tanstack/react-router";

/** Personalisation is user-level — send old repo URLs to the global page. */
export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/personalisation",
)({
  beforeLoad: () => {
    throw redirect({ to: "/settings/personalisation" });
  },
});
