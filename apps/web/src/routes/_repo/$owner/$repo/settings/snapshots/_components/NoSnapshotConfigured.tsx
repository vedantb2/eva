import { IconCamera } from "@tabler/icons-react";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";

/**
 * Shown on the Status and Builds tabs when no snapshot config exists yet —
 * both tabs are empty until the Configuration tab has been filled in.
 */
export function NoSnapshotConfigured() {
  return (
    <div className="rounded-surface border border-border bg-card">
      <SettingsEmptyState
        icon={IconCamera}
        title="No snapshot configured"
        description="Set a schedule and build commands on the Configuration tab to get started."
      />
    </div>
  );
}
