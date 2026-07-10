"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import {
  isSnapshotSettingsTab,
  type SnapshotSettingsTab,
} from "@/lib/search-params";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  CronScheduleCard,
  describeCron,
} from "@/lib/components/CronScheduleCard";
import {
  IconCamera,
  IconCheck,
  IconPlayerPlay,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { formatDurationMs } from "@conductor/shared/duration";
import { parseCommandLines, formatFileSize } from "./_utils";
import { RebuildRequiredWarning } from "./_components/RebuildRequiredWarning";
import { BuildRow, BuildStatusBadge } from "./_components/BuildRow";

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
  const isEnabled = snapshot?.enabled === true;

  // Save on change for schedule
  const handleScheduleChange = (newSchedule: string) => {
    saveRepoSnapshot({
      repoId,
      schedule: newSchedule,
      workflowRef: workflowRef.trim() || undefined,
      buildCommands: snapshot?.buildCommands,
    });
  };

  // Save on change for branch
  const handleBranchChange = (newBranch: string) => {
    saveRepoSnapshot({
      repoId,
      schedule,
      workflowRef: newBranch.trim() || undefined,
      buildCommands: snapshot?.buildCommands,
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
    });
  };

  const handleDelete = async () => {
    if (!snapshot) return;
    await deleteRepoSnapshot({ repoSnapshotId: snapshot._id });
  };

  const handleRebuild = async () => {
    if (!snapshot) return;
    setBuilding(true);
    try {
      await startBuild({ repoSnapshotId: snapshot._id });
    } catch {
      // Error already shown in UI via build status
    } finally {
      setBuilding(false);
    }
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

  const handleSnapshotsTabChange = useCallback(
    (value: string) => {
      if (!isSnapshotSettingsTab(value)) return;
      navigate({
        to: `${basePath}/settings/snapshots/${value}`,
      });
    },
    [basePath, navigate],
  );

  if (snapshot === undefined) {
    return (
      <PageWrapper title="Snapshots" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Snapshots" comfortable>
      <Tabs
        value={activeTab}
        onValueChange={handleSnapshotsTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="config-files">Config Files</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {snapshot && (
            <div className="flex justify-end">
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <IconTrash size={14} className="mr-1.5" />
                Delete Config
              </Button>
            </div>
          )}

          {snapshot && (
            <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Enabled</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When off, scheduled rebuilds are paused. Manual rebuilds
                    still work.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSnapshotEnabled({
                      repoSnapshotId: snapshot._id,
                      enabled: !isEnabled,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isEnabled ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform",
                      isEnabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          <CronScheduleCard
            value={schedule}
            onChange={handleScheduleChange}
            allowManual
          />

          <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
            <h3 className="text-sm font-medium">Clone Branch</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Branch
              </label>
              <BranchSelect
                value={workflowRef}
                onValueChange={handleBranchChange}
                className="h-8 text-xs"
                placeholder="Select a branch"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Branch to clone into the snapshot for dependency pre-caching.
                Defaults to <code>main</code> if empty.
              </p>
            </div>
          </div>

          {snapshot && <RebuildRequiredWarning />}

          <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
            <h3 className="text-sm font-medium">Build Commands</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Commands to run during snapshot build
              </label>
              <textarea
                key={`build-${snapshot?._id ?? "none"}`}
                defaultValue={buildCommandsText}
                onBlur={handleBuildCommandsBlur}
                className="w-full h-48 rounded-control border border-input bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="pnpm convex codegen&#10;pnpm build"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                One command per line. Runs as user <code>eva</code> in{" "}
                <code>/tmp/repo</code> after <code>pnpm install</code>, baked
                permanently into the snapshot. Use for codegen, build steps, or
                anything that should not re-run on every sandbox boot.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Requires sandbox provider credentials in team or repo environment
            variables: set <code className="font-mono">SANDBOX_PROVIDER</code>{" "}
            to <code className="font-mono">daytona</code> (
            <code className="font-mono">DAYTONA_API_KEY</code>) or{" "}
            <code className="font-mono">vercel</code> (
            <code className="font-mono">VERCEL_TOKEN</code>, team, and project).
          </p>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {snapshot ? (
            <>
              <div className="rounded-surface border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-medium">Current Status</h3>
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
                            return result.valid
                              ? result.text
                              : snapshot.schedule;
                          })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clone Branch</span>
                    <p className="font-mono mt-0.5">
                      {snapshot.workflowRef ?? "main"}
                    </p>
                  </div>
                  {lastBuild && (
                    <>
                      <div>
                        <span className="text-muted-foreground">
                          Last Build
                        </span>
                        <p className="mt-0.5">
                          {new Date(lastBuild.startedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
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
                  onClick={handleRebuild}
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
                <p className="text-[11px] text-muted-foreground">
                  Always rebuilds the base Image below.
                  {hasSeedableApps
                    ? " Also re-captures the optional seeded snapshot when apps have Stop Commands."
                    : " No seed file or Stop Commands required."}
                </p>
              </div>
              <div className="rounded-surface border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-medium">Base Image</h3>
                <p className="text-xs text-muted-foreground">
                  Provider-native base snapshot with toolchain,{" "}
                  <code className="font-mono text-[11px]">pnpm install</code>,
                  and your build commands. Daytona builds a declarative Image;
                  Vercel captures a running sandbox as{" "}
                  <code className="font-mono text-[11px]">snap_*</code>. This is
                  what sandboxes boot from unless a seeded snapshot exists.
                  Rebuild Now always refreshes this — no seed file needed.
                </p>
                {baseImageReady ? (
                  <div className="flex items-start gap-1 text-xs text-green-500">
                    <IconCheck size={12} className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="mr-1 text-muted-foreground">
                        Active:
                      </span>
                      <span className="font-mono break-all text-foreground">
                        {activeBaseSnapshotId}
                      </span>
                    </span>
                  </div>
                ) : isRunning ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                    <Spinner size="sm" />
                    Building base Image…
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {snapshot.baseSnapshotId ? (
                      <>
                        Last active:{" "}
                        <span className="font-mono">
                          {snapshot.baseSnapshotId}
                        </span>
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
              <div className="rounded-surface border border-border bg-muted/40 p-4 space-y-3">
                <h3 className="text-sm font-medium">
                  Seeded snapshot{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Running-sandbox capture with DB and services already started.
                  Only needed when cold boot is too slow — e.g. carepulse with
                  Supabase + Convex data. Configure Stop Commands on an app
                  (Settings → App); upload seed files only if startup commands
                  reference them.
                </p>
                {seededApps === undefined ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : isSeeding ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                    <Spinner size="sm" />
                    Capturing seeded snapshot…
                  </span>
                ) : sharedSeededSnapshotName ? (
                  <div className="flex items-start gap-1 text-xs text-green-500">
                    <IconCheck size={12} className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="mr-1 text-muted-foreground">
                        Active:
                      </span>
                      <span className="font-mono break-all">
                        {sharedSeededSnapshotName}
                      </span>
                    </span>
                  </div>
                ) : !hasSeedableApps ? (
                  <p className="text-xs text-muted-foreground">
                    Not configured — no apps have Stop Commands. Sandboxes use
                    the base Image only, which is fine for most repos.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not captured yet — run Rebuild Now after configuring app
                    startup/background/stop commands.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-surface border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No snapshot configured yet. Configure one in the Configuration
                tab.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builds" className="space-y-6">
          {snapshot && builds && builds.length > 0 ? (
            <div className="rounded-surface border border-border bg-muted/40 overflow-hidden">
              <div className="px-4 py-3">
                <h3 className="text-sm font-medium">Build History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[320px] sm:min-w-[420px]">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 py-2 font-medium w-8 sm:px-4" />
                      <th className="px-2 py-2 font-medium sm:px-4">Date</th>
                      <th className="px-2 py-2 font-medium sm:px-4">
                        Duration
                      </th>
                      <th className="px-2 py-2 font-medium sm:px-4">Trigger</th>
                      <th className="px-2 py-2 font-medium sm:px-4">Status</th>
                      <th className="px-2 py-2 font-medium sm:px-4">Seeded</th>
                    </tr>
                  </thead>
                  <tbody>
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
                          onToggle={() =>
                            setExpandedBuild(isExpanded ? null : build._id)
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : snapshot && builds && builds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IconCamera size={48} className="mb-3 opacity-40" />
              <p className="text-sm">
                No builds yet. Click "Rebuild Now" to start.
              </p>
            </div>
          ) : (
            <div className="rounded-surface border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No snapshot configured yet. Configure one in the Configuration
                tab.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="config-files" className="space-y-6">
          <ConfigFilesSection repoId={repoId} snapshotId={snapshot?._id} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

/**
 * Chunk size for splitting large file uploads. Convex enforces a 2-minute
 * server-side timeout on upload POSTs, so a 600MB single upload reliably stalls
 * once the server stops draining the TCP receive buffer. 100MB chunks finish
 * well within the timeout on broadband connections (~8s at 100Mbps, ~80s at
 * 10Mbps) and the snapshot/sandbox builder concatenates them back with `cat`.
 */
const UPLOAD_CHUNK_SIZE_BYTES = 100 * 1024 * 1024;

/** Extracts the storage ID from Convex's upload URL response body. */
function parseStorageIdResponse(text: string): Id<"_storage"> | null {
  try {
    const response = JSON.parse(text);
    return typeof response.storageId === "string" ? response.storageId : null;
  } catch {
    return null;
  }
}

/** Config files section for uploading files to be baked into snapshots. */
function ConfigFilesSection({
  repoId,
  snapshotId,
}: {
  repoId: Id<"githubRepos">;
  snapshotId?: Id<"repoSnapshots">;
}) {
  const files = useQuery(api.sandboxConfigFiles.list, { repoId });
  const generateUploadUrl = useMutation(
    api.sandboxConfigFiles.generateUploadUrl,
  );
  const saveFile = useMutation(api.sandboxConfigFiles.save);
  const removeFile = useMutation(api.sandboxConfigFiles.remove);
  const startBuild = useMutation(api.repoSnapshots.startBuild);

  const [uploading, setUploading] = useState(false);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const totalChunks = Math.max(
      1,
      Math.ceil(file.size / UPLOAD_CHUNK_SIZE_BYTES),
    );

    setUploading(true);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setChunkIndex(0);
    setChunkCount(totalChunks);
    setError(null);

    try {
      // Upload each chunk: fresh upload URL per chunk, POST the slice, collect
      // storage IDs. Sequential keeps memory bounded and progress monotonic;
      // parallelism would only help for many small chunks, which isn't our case.
      const chunkIds: Id<"_storage">[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * UPLOAD_CHUNK_SIZE_BYTES;
        const end = Math.min(start + UPLOAD_CHUNK_SIZE_BYTES, file.size);
        const chunk = file.slice(start, end);
        setChunkIndex(i + 1);

        const uploadUrl = await generateUploadUrl({ repoId });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: chunk,
        });
        const responseText = await result.text();
        if (!result.ok) {
          throw new Error(
            `Upload failed at chunk ${i + 1}/${totalChunks} (status ${result.status}): ${responseText}`,
          );
        }
        const storageId = parseStorageIdResponse(responseText);
        if (!storageId) {
          throw new Error(
            `Invalid response from storage at chunk ${i + 1}/${totalChunks}`,
          );
        }
        chunkIds.push(storageId);
        setUploadedBytes(end);
      }

      // Save file record with all chunk IDs in order
      await saveFile({
        repoId,
        chunks: chunkIds,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
      setUploadedBytes(0);
      setTotalBytes(0);
      setChunkIndex(0);
      setChunkCount(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRebuild = async () => {
    if (!snapshotId) return;
    try {
      await startBuild({ repoSnapshotId: snapshotId });
    } catch {
      // Error shown via build status
    }
  };

  return (
    <div className="space-y-4">
      <RebuildRequiredWarning />

      <div className="rounded-surface border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium">
            Sandbox Config Files{" "}
            <span className="font-normal text-muted-foreground">
              (optional — seeded snapshots only)
            </span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Files uploaded here are copied into the codebase root when a sandbox
            starts. They are also available at{" "}
            <code className="font-mono text-[11px]">
              /home/eva/sandbox-config/
            </code>{" "}
            and{" "}
            <code className="font-mono text-[11px]">/tmp/sandbox-config/</code>
            {". "}
            Only needed when app startup commands reference sensitive seeds
            (e.g. SQL dumps) that cannot live in git. Base Image rebuilds do not
            require any files here.
          </p>
        </div>

        {error && (
          <div className="rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="config-file-upload"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="mr-1.5" />
                {totalBytes === 0
                  ? "Preparing..."
                  : `Chunk ${chunkIndex}/${chunkCount} • ${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes)}`}
              </>
            ) : (
              <>
                <IconUpload size={14} className="mr-1.5" />
                Upload File
              </>
            )}
          </Button>
          {snapshotId && files && files.length > 0 && (
            <Button size="sm" onClick={handleRebuild}>
              <IconPlayerPlay size={14} className="mr-1.5" />
              Rebuild Snapshot
            </Button>
          )}
        </div>

        {/* Files table */}
        {files && files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">File Name</th>
                  <th className="px-2 py-2 font-medium">Size</th>
                  <th className="px-2 py-2 font-medium">Uploaded</th>
                  <th className="px-2 py-2 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file._id} className="hover:bg-muted/30">
                    <td className="px-2 py-2 font-mono">{file.fileName}</td>
                    <td className="px-2 py-2">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-2 py-2">
                      {new Date(file.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile({ id: file._id })}
                        className="h-6 w-6 p-0"
                      >
                        <IconTrash size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : files && files.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No config files uploaded yet.
          </p>
        ) : (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
