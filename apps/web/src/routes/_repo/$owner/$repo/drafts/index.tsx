import { createFileRoute } from "@tanstack/react-router";
import { DraftsClient } from "./DraftsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/drafts/")({
  component: DraftsClient,
});
