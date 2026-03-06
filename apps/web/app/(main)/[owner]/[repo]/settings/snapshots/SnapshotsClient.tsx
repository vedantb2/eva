"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Input,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";
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

function describeCron(
  expression: string,
): { valid: true; text: string } | { valid: false; partial: boolean } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return { valid: false, partial: true };
  try {
    return {
      valid: true,
      text: cronstrue.toString(expression, { use24HourTimeFormat: false }),
    };
  } catch {
    return { valid: false, partial: false };
  }
}

function nextCronDate(expression: string): string | null {
  try {
    const iter = CronExpressionParser.parse(expression, { tz: "UTC" });
    const next = iter.next().toDate();
    return next.toLocaleString("en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

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

        <TabsContent value="configuration" className="space-y-6">
          <div className="rounded-lg border border-border/70 p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium">Snapshot Configuration</h3>
              {snapshot && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  className="self-start sm:self-auto"
                >
                  <IconTrash size={14} className="mr-1.5" />
                  Delete Config
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Rebuild Schedule
                </label>
                <CronPreview schedule={schedule} />
                <Input
                  value={schedule === "manual" ? "" : schedule}
                  onChange={(e) => setSchedule(e.target.value || "manual")}
                  onBlur={() => setSchedule((prev) => prev.trim() || "manual")}
                  placeholder="0 6 * * * (leave empty for manual)"
                  className="h-8 font-mono text-xs text-center"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Cron expression in UTC. Leave empty for manual only.
                </p>
                <CronGuide />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Workflow Branch
                </label>
                <BranchSelect
                  value={workflowRef}
                  onValueChange={setWorkflowRef}
                  className="h-8 text-xs"
                  placeholder="Select a branch"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Branch where <code>rebuild-snapshot.yml</code> exists.
                  Defaults to <code>main</code> if empty.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/40 sm:flex-row sm:items-center sm:justify-between">
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
                className="self-end sm:self-auto shrink-0"
              >
                {saving ? <Spinner size="sm" className="mr-1.5" /> : null}
                Save
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {snapshot ? (
            <div className="rounded-lg border border-border/70 p-4 space-y-3">
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
            <div className="rounded-lg border border-border/70 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No snapshot configured yet. Configure one in the Configuration
                tab.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builds" className="space-y-6">
          {snapshot && builds && builds.length > 0 ? (
            <div className="rounded-lg border border-border/70 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60">
                <h3 className="text-sm font-medium">Build History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium w-8" />
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Trigger</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {builds.map((build) => {
                      const isExpanded = expandedBuild === build._id;
                      const duration = build.completedAt
                        ? formatDuration(build.completedAt - build.startedAt)
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
            <div className="rounded-lg border border-border/70 p-8 text-center">
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
      <tr
        className="border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/30"
        onClick={onToggle}
      >
        <td className="px-4 py-2">
          {isExpanded ? (
            <IconChevronDown size={14} />
          ) : (
            <IconChevronRight size={14} />
          )}
        </td>
        <td className="px-4 py-2">
          {new Date(build.startedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
        <td className="px-4 py-2">{duration}</td>
        <td className="px-4 py-2 capitalize">{build.triggeredBy}</td>
        <td className="px-4 py-2">
          <BuildStatusBadge status={build.status} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border/40">
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
              <pre className="max-h-64 overflow-auto rounded bg-muted/50 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function CronPreview({ schedule }: { schedule: string }) {
  if (schedule === "manual") {
    return (
      <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
        <p className="text-sm text-muted-foreground">Manual only</p>
      </div>
    );
  }

  const result = describeCron(schedule);

  if (!result.valid) {
    return (
      <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
        <p className="text-sm text-muted-foreground">
          {result.partial
            ? "Type a cron expression..."
            : "Invalid cron expression"}
        </p>
      </div>
    );
  }

  const next = nextCronDate(schedule);

  return (
    <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
      <p className="text-lg font-medium">{result.text}</p>
      {next && (
        <p className="text-[11px] text-muted-foreground">next at {next} UTC</p>
      )}
    </div>
  );
}

function CronGuide() {
  return (
    <div className="mt-3 rounded-md border border-border/50 overflow-hidden">
      <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50">
        <p className="text-[11px] font-medium text-muted-foreground">
          Cron format reference
        </p>
      </div>
      <div className="p-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
        <pre className="font-mono text-[11px] text-muted-foreground leading-relaxed shrink-0">
          {"┌─ minute (0-59)\n"}
          {"│ ┌─ hour (0-23)\n"}
          {"│ │ ┌─ day of month (1-31)\n"}
          {"│ │ │ ┌─ month (1-12)\n"}
          {"│ │ │ │ ┌─ day of week (0-6)\n"}
          {"* * * * *"}
        </pre>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] content-start">
          {[
            ["*", "any value"],
            [",", "list separator"],
            ["-", "range"],
            ["/", "step values"],
            ["0-6", "day of week range"],
            ["SUN-SAT", "day names"],
          ].map(([symbol, desc]) => (
            <div key={symbol} className="contents">
              <span className="font-mono text-foreground/70">{symbol}</span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
