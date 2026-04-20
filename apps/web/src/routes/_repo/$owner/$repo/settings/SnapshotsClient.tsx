"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  CronScheduleCard,
  describeCron,
} from "@/lib/components/CronScheduleCard";
import {
  IconCamera,
  IconPlayerPlay,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconX,
  IconClock,
  IconUpload,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatDurationMs } from "@/lib/utils/formatDuration";

export function SnapshotsClient() {
  const { repoId, owner, name: repoName } = useRepo();
  const snapshot = useQuery(api.repoSnapshots.getRepoSnapshot, { repoId });
  const builds = useQuery(
    api.repoSnapshots.listBuilds,
    snapshot ? { repoSnapshotId: snapshot._id } : "skip",
  );
  const saveRepoSnapshot = useMutation(api.repoSnapshots.saveRepoSnapshot);
  const deleteRepoSnapshot = useMutation(api.repoSnapshots.deleteRepoSnapshot);
  const startBuild = useMutation(api.repoSnapshots.startBuild);

  const [schedule, setSchedule] = useState("manual");
  const [workflowRef, setWorkflowRef] = useState("main");
  const [startupCommands, setStartupCommands] = useState("");
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot === undefined) return;

    if (snapshot) {
      setSchedule(snapshot.schedule);
      setWorkflowRef(snapshot.workflowRef ?? "main");
      setStartupCommands(snapshot.startupCommands?.join("\n") ?? "");
      return;
    }

    setSchedule("manual");
    setWorkflowRef("main");
    setStartupCommands("");
  }, [snapshot?._id, snapshot?.updatedAt, snapshot === null]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse startup commands: split by newlines, trim, filter empty
      const commands = startupCommands
        .split("\n")
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd.length > 0);

      await saveRepoSnapshot({
        repoId,
        schedule,
        workflowRef: workflowRef.trim() || undefined,
        startupCommands: commands.length > 0 ? commands : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!snapshot) return;
    await deleteRepoSnapshot({ repoSnapshotId: snapshot._id });
    setSchedule("manual");
    setWorkflowRef("main");
    setStartupCommands("");
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
      <Tabs defaultValue="configuration" className="space-y-4">
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

          <CronScheduleCard
            value={schedule}
            onChange={setSchedule}
            allowManual
          />

          <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
            <h3 className="text-sm font-medium">Clone Branch</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Branch
              </label>
              <BranchSelect
                value={workflowRef}
                onValueChange={setWorkflowRef}
                className="h-8 text-xs"
                placeholder="Select a branch"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Branch to clone into the snapshot for dependency pre-caching.
                Defaults to <code>main</code> if empty.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
            <h3 className="text-sm font-medium">Startup Commands</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Commands to run when sandbox starts
              </label>
              <textarea
                value={startupCommands}
                onChange={(e) => setStartupCommands(e.target.value)}
                className="w-full h-24 rounded-md bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="npx supabase start&#10;psql -h localhost -p 54322 -U postgres -d postgres < /tmp/sandbox-config/seed.sql"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                One command per line. Runs once when sandbox first starts (after
                snapshot loads). Use for services like{" "}
                <code>supabase start</code> or database seeding. Commands have a
                10-minute timeout each.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              Requires <code className="font-mono">DAYTONA_API_KEY</code> in
              team or repo environment variables.
            </p>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0"
            >
              {saving ? <Spinner size="sm" className="mr-1.5" /> : null}
              Save
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {snapshot ? (
            <div className="rounded-lg bg-muted/40 p-4 space-y-3">
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
                          return result.valid ? result.text : snapshot.schedule;
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
                      <span className="text-muted-foreground">Last Build</span>
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
                    <div>
                      <span className="text-muted-foreground">Warmup</span>
                      <p className="mt-0.5">
                        <WarmupStatusBadge status={lastBuild.warmupStatus} />
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleRebuild}
                disabled={building || isRunning}
              >
                {isRunning ? (
                  <Spinner size="sm" className="mr-1.5" />
                ) : (
                  <IconPlayerPlay size={14} className="mr-1.5" />
                )}
                {isRunning ? "Building..." : "Rebuild Now"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No snapshot configured yet. Configure one in the Configuration
                tab.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builds" className="space-y-6">
          {snapshot && builds && builds.length > 0 ? (
            <div className="rounded-lg bg-muted/40 overflow-hidden">
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
                      <th className="px-2 py-2 font-medium sm:px-4">Warmup</th>
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
            <div className="rounded-lg bg-muted/40 p-8 text-center">
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

function BuildRow({
  build,
  isExpanded,
  duration,
  onToggle,
}: {
  build: {
    _id: Id<"snapshotBuilds">;
    status: "running" | "success" | "error";
    triggeredBy: "cron" | "manual";
    logs: string;
    error?: string;
    startedAt: number;
    completedAt?: number;
    warmupStatus?: "pending" | "success" | "error";
    warmupError?: string;
  };
  isExpanded: boolean;
  duration: string;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="cursor-pointer hover:bg-muted/30" onClick={onToggle}>
        <td className="px-2 py-2 sm:px-4">
          {isExpanded ? (
            <IconChevronDown size={14} />
          ) : (
            <IconChevronRight size={14} />
          )}
        </td>
        <td className="px-2 py-2 sm:px-4">
          {new Date(build.startedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
        <td className="px-2 py-2 sm:px-4">{duration}</td>
        <td className="px-2 py-2 capitalize sm:px-4">{build.triggeredBy}</td>
        <td className="px-2 py-2 sm:px-4">
          <BuildStatusBadge status={build.status} />
        </td>
        <td className="px-2 py-2 sm:px-4">
          <WarmupStatusBadge status={build.warmupStatus} />
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-4 py-3">
            {build.error && (
              <div className="mb-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {build.error}
              </div>
            )}
            {build.warmupError && (
              <div className="mb-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Warmup failed: {build.warmupError}
              </div>
            )}
            {build.logs ? (
              <pre className="max-h-64 overflow-auto rounded bg-muted/50 p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap sm:p-3 sm:text-[11px]">
                {build.logs}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                No logs available.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function BuildStatusBadge({
  status,
}: {
  status: "running" | "success" | "error";
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-blue-500">
        <IconClock size={12} />
        Running
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-green-500">
        <IconCheck size={12} />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-destructive">
      <IconX size={12} />
      Error
    </span>
  );
}

function WarmupStatusBadge({
  status,
}: {
  status?: "pending" | "success" | "error";
}) {
  if (!status) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-blue-500">
        <IconClock size={12} />
        Pending
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-green-500">
        <IconCheck size={12} />
        Warmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-destructive">
      <IconX size={12} />
      Failed
    </span>
  );
}

/** Formats bytes into human-readable size. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ repoId });

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = (await result.json()) as {
        storageId: Id<"_storage">;
      };

      // Save file record
      await saveFile({
        repoId,
        storageId,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
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
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
        <IconAlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-amber-500"
        />
        <div className="text-xs">
          <p className="font-medium text-amber-500">
            Rebuild required after changes
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Files are baked into snapshots during build. After adding or
            removing files, rebuild the snapshot for changes to take effect.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium">Sandbox Config Files</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Files uploaded here will be baked into snapshots at{" "}
            <code className="font-mono text-[11px]">/tmp/sandbox-config/</code>.
            Use for sensitive files like database seeds that cannot be committed
            to the repo.
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
              <Spinner size="sm" className="mr-1.5" />
            ) : (
              <IconUpload size={14} className="mr-1.5" />
            )}
            Upload File
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
