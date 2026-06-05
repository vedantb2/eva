import { IconAlertTriangle } from "@tabler/icons-react";

/**
 * Amber banner shown alongside snapshot inputs that only take effect after a
 * rebuild (config files, build commands). Standalone presentational component
 * — no hooks, no client directive needed by parents that already opt in.
 */
export function RebuildRequiredWarning() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-3">
      <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
      <div className="text-xs">
        <p className="font-medium text-warning">
          Rebuild required after changes
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Changes are baked into snapshots during build. After editing, rebuild
          the snapshot for changes to take effect.
        </p>
      </div>
    </div>
  );
}
