import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  isSnapshotSettingsTab,
  type SnapshotSettingsTab,
} from "@/lib/search-params";
import { SnapshotsClient } from "../SnapshotsClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/snapshots/$snapTab",
)({
  beforeLoad: ({ params }) => {
    if (!isSnapshotSettingsTab(params.snapTab)) {
      throw redirect({
        to: "/$owner/$repo/settings/snapshots/$snapTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          snapTab: "configuration",
        },
      });
    }
  },
  component: SnapshotsTabRoute,
});

function SnapshotsTabRoute() {
  const { snapTab } = Route.useParams();
  const tab: SnapshotSettingsTab = isSnapshotSettingsTab(snapTab)
    ? snapTab
    : "configuration";
  return <SnapshotsClient activeTab={tab} />;
}
