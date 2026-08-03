import { Button, Spinner, StatusDot } from "@eva/ui";
import { IconPlayerPlay } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { describeCron } from "@/lib/components/CronScheduleCard";
import { BuildStatusBadge } from "../../_components/BuildRow";
import { NoSnapshotConfigured } from "./NoSnapshotConfigured";
import type { RepoSnapshot, SeededAppStatus, SnapshotBuild } from "../_utils";

/** Current build status plus base/seeded Image state for a repo's snapshot. */
export function StatusTab({
  snapshot,
  lastBuild,
  isRunning,
  isSeeding,
  building,
  hasSeedableApps,
  activeBaseSnapshotId,
  baseImageReady,
  sharedSeededSnapshotName,
  seededApps,
  onRebuild,
}: {
  snapshot: RepoSnapshot | null;
  lastBuild: SnapshotBuild | null;
  isRunning: boolean;
  isSeeding: boolean;
  building: boolean;
  hasSeedableApps: boolean;
  activeBaseSnapshotId: string | null;
  baseImageReady: boolean;
  sharedSeededSnapshotName: string | null;
  seededApps: SeededAppStatus[] | undefined;
  onRebuild: () => void;
}) {
  if (!snapshot) {
    return <NoSnapshotConfigured />;
  }

  return (
    <>
      <SettingsSection title="Current Status">
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:gap-4">
          <div>
            <span className="text-muted-foreground">Snapshot Name</span>
            <p className="font-mono mt-0.5">{snapshot.snapshotName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Schedule</span>
            <p className="mt-0.5">
              {snapshot.schedule === "manual"
                ? "Manual"
                : (() => {
                    const result = describeCron(snapshot.schedule);
                    return result.valid ? result.text : snapshot.schedule;
                  })()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Clone Branch</span>
            <p className="font-mono mt-0.5">{snapshot.workflowRef ?? "main"}</p>
          </div>
          {lastBuild && (
            <>
              <div>
                <span className="text-muted-foreground">Last Build</span>
                <p className="mt-0.5">
                  {new Date(lastBuild.startedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="mt-0.5">
                  <BuildStatusBadge status={lastBuild.status} />
                </p>
              </div>
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={onRebuild}
          disabled={building || isRunning || isSeeding}
        >
          {building || isRunning || isSeeding ? (
            <Spinner size="sm" className="mr-1.5" />
          ) : (
            <IconPlayerPlay size={14} className="mr-1.5" />
          )}
          {building || isRunning
            ? "Building..."
            : isSeeding
              ? "Seeding..."
              : "Rebuild Now"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Always rebuilds the base Image below.
          {hasSeedableApps
            ? " Also re-captures the optional seeded snapshot when apps have Stop Commands."
            : " No seed file or Stop Commands required."}
        </p>
      </SettingsSection>
      <SettingsSection
        title="Images"
        description={
          <>
            Base snapshot with toolchain, <code>pnpm install</code>, and your
            build commands. Eva captures a running sandbox as{" "}
            <code>snap_*</code>. This is what sandboxes boot from unless a
            seeded snapshot exists.
          </>
        }
      >
        <div>
          <h4 className="text-xs font-medium text-foreground">Base Image</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Rebuild Now always refreshes this — no seed file needed.
          </p>
          <div className="mt-3">
            {baseImageReady ? (
              <div className="flex items-start gap-1.5 text-xs text-foreground">
                <StatusDot tone="done" className="mt-1" />
                <span className="min-w-0">
                  <span className="mr-1 text-muted-foreground">Active:</span>
                  <span className="font-mono break-all text-foreground">
                    {activeBaseSnapshotId}
                  </span>
                </span>
              </div>
            ) : isRunning ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Spinner size="sm" />
                Building base Image…
              </span>
            ) : (
              <p className="text-xs text-muted-foreground">
                {snapshot.baseSnapshotId ? (
                  <>
                    Last active:{" "}
                    <span className="font-mono">{snapshot.baseSnapshotId}</span>
                    {" — "}
                  </>
                ) : null}
                Config name:{" "}
                <span className="font-mono">{snapshot.snapshotName}</span>
                {lastBuild?.status === "error"
                  ? " — last build failed; click Rebuild Now to retry."
                  : " — not built yet; click Rebuild Now."}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-xs font-medium text-foreground">
            Seeded snapshot{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Running-sandbox capture with DB and services already started.
            Only needed when cold boot is too slow. Configure Stop Commands on
            an app (Settings → App); upload seed files only if startup
            commands reference them.
          </p>
          <div className="mt-3">
            {seededApps === undefined ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : isSeeding ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Spinner size="sm" />
                Capturing seeded snapshot…
              </span>
            ) : sharedSeededSnapshotName ? (
              <div className="flex items-start gap-1.5 text-xs text-foreground">
                <StatusDot tone="done" className="mt-1" />
                <span className="min-w-0">
                  <span className="mr-1 text-muted-foreground">Active:</span>
                  <span className="font-mono break-all">
                    {sharedSeededSnapshotName}
                  </span>
                </span>
              </div>
            ) : !hasSeedableApps ? (
              <p className="text-xs text-muted-foreground">
                Not configured — no apps have Stop Commands. Sandboxes use the
                base Image only, which is fine for most repos.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not captured yet — run Rebuild Now after configuring app
                startup/background/stop commands.
              </p>
            )}
          </div>
        </div>
      </SettingsSection>
    </>
  );
}
