"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  IconExternalLink,
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
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot === undefined) return;

    if (snapshot) {
      setSchedule(snapshot.schedule);
      setWorkflowRef(snapshot.workflowRef ?? "main");
      return;
    }

    setSchedule("manual");
    setWorkflowRef("main");
  }, [snapshot?._id, snapshot?.updatedAt, snapshot === null]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRepoSnapshot({
        repoId,
        schedule,
        workflowRef: workflowRef.trim() || undefined,
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
      <PageWrapper title="Snapshots">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Snapshots">
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
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
            <h3 className="text-sm font-medium">Workflow Branch</h3>
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
                Branch where <code>rebuild-snapshot.yml</code> exists. Defaults
                to <code>main</code> if empty.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              Requires <code className="font-mono">rebuild-snapshot.yml</code>{" "}
              workflow on target branch and{" "}
              <code className="font-mono">DAYTONA_API_KEY</code> secret in the
              repo.
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
                          return result.valid
                            ? `${result.text} (UTC)`
                            : snapshot.schedule;
                        })()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Workflow Branch</span>
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
                          repoFullName={`${owner}/${repoName}`}
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
      </Tabs>
    </PageWrapper>
  );
}

function BuildRow({
  build,
  isExpanded,
  duration,
  repoFullName,
  onToggle,
}: {
  build: {
    _id: Id<"snapshotBuilds">;
    status: "running" | "success" | "error";
    triggeredBy: "cron" | "manual";
    logs: string;
    error?: string;
    workflowRunId?: number;
    startedAt: number;
    completedAt?: number;
  };
  isExpanded: boolean;
  duration: string;
  repoFullName: string;
  onToggle: () => void;
}) {
  const runUrl = build.workflowRunId
    ? `https://github.com/${repoFullName}/actions/runs/${build.workflowRunId}`
    : null;

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
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-3">
            {build.error && (
              <div className="mb-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {build.error}
              </div>
            )}
            {runUrl && (
              <a
                href={runUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <IconExternalLink size={12} />
                View GitHub Actions Run
              </a>
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
