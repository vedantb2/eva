import { createFileRoute } from "@tanstack/react-router";
import { SnapshotsClient } from "./SnapshotsClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/snapshots",
)({
  component: SnapshotsClient,
});
