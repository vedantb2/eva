"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useNavigate } from "@tanstack/react-router";
import {
  isSnapshotSettingsTab,
  type SnapshotSettingsTab,
} from "@/lib/search-params";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { Button, Skeleton, Tabs, TabsList, TabsTrigger } from "@eva/ui";
import { IconTrash } from "@tabler/icons-react";
import { parseCommandLines } from "./_utils";
import { ConfigurationTab } from "./snapshots/_components/ConfigurationTab";
import { StatusTab } from "./snapshots/_components/StatusTab";
import { BuildsTab } from "./snapshots/_components/BuildsTab";
import { ConfigFilesTab } from "./snapshots/_components/ConfigFilesTab";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

const SNAPSHOT_TABS = (
  <TabsList>
    <TabsTrigger value="configuration">Configuration</TabsTrigger>
    <TabsTrigger value="status">Status</TabsTrigger>
    <TabsTrigger value="builds">Builds</TabsTrigger>
    <TabsTrigger value="config-files">Config Files</TabsTrigger>
  </TabsList>
);

export function SnapshotsClient({
  activeTab,
}: {
  activeTab: SnapshotSettingsTab;
}) {
  const navigate = useNavigate();
  const { repoId, basePath } = useRepo();
  const snapshot = useQuery(api.repoSnapshots.getRepoSnapshot, { repoId });
  const builds = useQuery(
    api.repoSnapshots.listBuilds,
    snapshot ? { repoSnapshotId: snapshot._id } : "skip",
  );
  const seededApps = useQuery(
    api.repoSnapshots.getSeededAppStatus,
    snapshot ? { repoSnapshotId: snapshot._id } : "skip",
  );
  const saveRepoSnapshot = useMutation(api.repoSnapshots.saveRepoSnapshot);
  const deleteRepoSnapshot = useMutation(api.repoSnapshots.deleteRepoSnapshot);
  const startBuild = useMutation(api.repoSnapshots.startBuild);
  const setSnapshotEnabled = useMutation(api.repoSnapshots.setSnapshotEnabled);

  // UI-only state (not data)
  const [building, setBuilding] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  // Derive values directly from Convex
  const schedule = snapshot?.schedule ?? "manual";
  const workflowRef = snapshot?.workflowRef ?? "main";
  const buildCommandsText = snapshot?.buildCommands?.join("\n") ?? "";
  const seedCommandsText = snapshot?.seedCommands?.join("\n") ?? "";
  const isEnabled = snapshot?.enabled === true;

  // Save on change for schedule
  const handleScheduleChange = (newSchedule: string) => {
    saveRepoSnapshot({
      repoId,
      schedule: newSchedule,
      workflowRef: workflowRef.trim() || undefined,
      buildCommands: snapshot?.buildCommands,
      seedCommands: snapshot?.seedCommands,
    });
  };

  // Save on change for branch
  const handleBranchChange = (newBranch: string) => {
    saveRepoSnapshot({
      repoId,
      schedule,
      workflowRef: newBranch.trim() || undefined,
      buildCommands: snapshot?.buildCommands,
      seedCommands: snapshot?.seedCommands,
    });
  };

  // Save on blur for build commands
  const handleBuildCommandsBlur = (
    e: React.FocusEvent<HTMLTextAreaElement>,
  ) => {
    const next = e.target.value;
    if (next === buildCommandsText) return;
    const parsed = parseCommandLines(next);
    saveRepoSnapshot({
      repoId,
      schedule,
      workflowRef: workflowRef.trim() || undefined,
      buildCommands: parsed.length > 0 ? parsed : undefined,
      seedCommands: snapshot?.seedCommands,
    });
  };

  // Save on blur for seed commands
  const handleSeedCommandsBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next === seedCommandsText) return;
    const parsed = parseCommandLines(next);
    saveRepoSnapshot({
      repoId,
      schedule,
      workflowRef: workflowRef.trim() || undefined,
      buildCommands: snapshot?.buildCommands,
      seedCommands: parsed.length > 0 ? parsed : undefined,
    });
  };

  const handleEnabledChange = (enabled: boolean) => {
    if (!snapshot) return;
    setSnapshotEnabled({ repoSnapshotId: snapshot._id, enabled });
  };

  const handleDelete = async () => {
    if (!snapshot) return;
    await deleteRepoSnapshot({ repoSnapshotId: snapshot._id });
  };

  const handleRebuild = async () => {
    if (!snapshot) return;
    setBuilding(true);
    try {
      await startBuild({ repoSnapshotId: snapshot._id, appRepoId: repoId });
    } catch {
      // Error already shown in UI via build status
    }
    setBuilding(false);
  };

  const isRunning =
    builds && builds.length > 0 && builds[0].status === "running";
  const lastBuild = builds && builds.length > 0 ? builds[0] : null;
  // Base image is marked success before Step 5 seeding runs, so "in progress"
  // must also cover an ongoing seed (any app still in the "running" state).
  const isSeeding = (lastBuild?.seededApps ?? []).some(
    (a) => a.status === "running",
  );
  // The build now produces a single seeded snapshot shared by every app in the
  // repo, so the per-app rows all carry the same seededSnapshotName. Take the
  // first seeded entry as the one shared snapshot.
  const sharedSeededSnapshotName =
    seededApps?.find((app) => app.seededSnapshotName !== null)
      ?.seededSnapshotName ?? null;
  const hasSeedableApps = (seededApps?.length ?? 0) > 0;
  const activeBaseSnapshotId =
    snapshot?.baseSnapshotId ?? snapshot?.snapshotName ?? null;
  const baseImageReady =
    lastBuild?.status === "success" && !isRunning && !isSeeding;

  const handleSnapshotsTabChange = (value: string) => {
    if (!isSnapshotSettingsTab(value)) return;
    navigate({
      to: toInternalRepoHref(`${basePath}/settings/snapshots/${value}`),
    });
  };

  if (snapshot === undefined) {
    return (
      <SettingsPage
        title="Snapshots"
        tabs={
          <Tabs value={activeTab} onValueChange={handleSnapshotsTabChange}>
            {SNAPSHOT_TABS}
          </Tabs>
        }
      >
        <div
          className="flex min-h-[28rem] flex-col gap-4"
          aria-busy="true"
          aria-label="Loading snapshots"
        >
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-48 border border-border" />
          <Skeleton className="h-32 border border-border" />
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage
      title="Snapshots"
      headerRight={
        snapshot && activeTab === "configuration" ? (
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <IconTrash size={14} className="mr-1.5" />
            Delete Config
          </Button>
        ) : null
      }
      tabs={
        <Tabs value={activeTab} onValueChange={handleSnapshotsTabChange}>
          {SNAPSHOT_TABS}
        </Tabs>
      }
    >
      {activeTab === "configuration" ? (
        <ConfigurationTab
          snapshot={snapshot}
          schedule={schedule}
          workflowRef={workflowRef}
          buildCommandsText={buildCommandsText}
          seedCommandsText={seedCommandsText}
          isEnabled={isEnabled}
          onScheduleChange={handleScheduleChange}
          onBranchChange={handleBranchChange}
          onBuildCommandsBlur={handleBuildCommandsBlur}
          onSeedCommandsBlur={handleSeedCommandsBlur}
          onEnabledChange={handleEnabledChange}
        />
      ) : null}

      {activeTab === "status" ? (
        <StatusTab
          snapshot={snapshot}
          lastBuild={lastBuild}
          isRunning={isRunning === true}
          isSeeding={isSeeding}
          building={building}
          hasSeedableApps={hasSeedableApps}
          activeBaseSnapshotId={activeBaseSnapshotId}
          baseImageReady={baseImageReady}
          sharedSeededSnapshotName={sharedSeededSnapshotName}
          seededApps={seededApps}
          onRebuild={handleRebuild}
        />
      ) : null}

      {activeTab === "builds" ? (
        <BuildsTab
          snapshot={snapshot}
          builds={builds}
          expandedBuild={expandedBuild}
          onToggleExpand={(buildId) =>
            setExpandedBuild(expandedBuild === buildId ? null : buildId)
          }
        />
      ) : null}

      {activeTab === "config-files" ? (
        <ConfigFilesTab repoId={repoId} snapshotId={snapshot?._id} />
      ) : null}
    </SettingsPage>
  );
}
