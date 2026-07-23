import { createFileRoute } from "@tanstack/react-router";

/**
 * Param + beforeLoad host for `/sessions/$numId/…`. The session shell is
 * rendered by the parent `sessions` layout (`CachedSessionShell`) so Preview
 * survives switching between sessions.
 */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId")({
  component: () => null,
});
