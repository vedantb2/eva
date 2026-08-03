import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@eva/ui";
import { IconCamera } from "@tabler/icons-react";
import { formatDurationMs } from "@eva/shared/duration";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { BuildRow } from "../../_components/BuildRow";
import { NoSnapshotConfigured } from "./NoSnapshotConfigured";
import type { RepoSnapshot, SnapshotBuild } from "../_utils";

/** Build History table, showing the most recent snapshot builds. */
export function BuildsTab({
  snapshot,
  builds,
  expandedBuild,
  onToggleExpand,
}: {
  snapshot: RepoSnapshot | null;
  builds: SnapshotBuild[] | undefined;
  expandedBuild: string | null;
  onToggleExpand: (buildId: string) => void;
}) {
  if (snapshot && builds && builds.length > 0) {
    // Rows own their padding so the table spans the card's full width.
    return (
      <SettingsSection title="Build History" bodyVariant="list">
        <div className="overflow-x-auto">
          <Table className="min-w-[320px] text-xs sm:min-w-[420px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8 px-2 sm:px-4" />
                <TableHead className="px-2 sm:px-4">Date</TableHead>
                <TableHead className="px-2 sm:px-4">Duration</TableHead>
                <TableHead className="px-2 sm:px-4">Trigger</TableHead>
                <TableHead className="px-2 sm:px-4">Provider</TableHead>
                <TableHead className="px-2 sm:px-4">Type</TableHead>
                <TableHead className="px-2 sm:px-4">Status</TableHead>
                <TableHead className="px-2 sm:px-4">Seeded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {builds.map((build) => {
                const isExpanded = expandedBuild === build._id;
                const duration = build.completedAt
                  ? formatDurationMs(build.completedAt - build.startedAt)
                  : build.status === "running"
                    ? "Running..."
                    : "-";
                return (
                  <BuildRow
                    key={build._id}
                    build={build}
                    isExpanded={isExpanded}
                    duration={duration}
                    onToggle={() => onToggleExpand(build._id)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SettingsSection>
    );
  }

  if (snapshot && builds && builds.length === 0) {
    return (
      <SettingsSection title="Build History" bodyVariant="list">
        <SettingsEmptyState
          icon={IconCamera}
          title="No builds yet"
          description="Select Rebuild Now on the Status tab to run the first build."
        />
      </SettingsSection>
    );
  }

  return <NoSnapshotConfigured />;
}
