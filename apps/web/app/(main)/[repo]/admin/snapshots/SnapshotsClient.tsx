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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconCamera,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconX,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react";

type Schedule = "daily" | "every_3_days" | "weekly" | "manual";

const SCHEDULE_LABELS: Record<Schedule, string> = {
  daily: "Daily",
  every_3_days: "Every 3 Days",
  weekly: "Weekly",
  manual: "Manual Only",
};

export function SnapshotsClient() {
  const { repoId, fullName } = useRepo();
  const snapshot = useQuery(api.repoSnapshots.getRepoSnapshot, { repoId });
  const builds = useQuery(
    api.repoSnapshots.listBuilds,
    snapshot ? { repoSnapshotId: snapshot._id } : "skip",
  );
  const saveRepoSnapshot = useMutation(api.repoSnapshots.saveRepoSnapshot);
  const deleteRepoSnapshot = useMutation(api.repoSnapshots.deleteRepoSnapshot);
  const startBuild = useMutation(api.repoSnapshots.startBuild);

  const [schedule, setSchedule] = useState<Schedule>("daily");
  const [workflowRef, setWorkflowRef] = useState("main");
  const [commandsText, setCommandsText] = useState("");
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    [],
  );
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot === undefined) return;

    if (snapshot) {
      setSchedule(snapshot.schedule);
      setWorkflowRef(snapshot.workflowRef ?? "main");
      setCommandsText(snapshot.customSetupCommands.join("\n"));
      setEnvVars(snapshot.customEnvVars);
      return;
    }

    setSchedule("daily");
    setWorkflowRef("main");
    setCommandsText("");
    setEnvVars([]);
  }, [snapshot?._id, snapshot?.updatedAt, snapshot === null]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const commands = commandsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      await saveRepoSnapshot({
        repoId,
        schedule,
        workflowRef: workflowRef.trim() || undefined,
        customSetupCommands: commands,
        customEnvVars: envVars,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!snapshot) return;
    await deleteRepoSnapshot({ repoSnapshotId: snapshot._id });
    setSchedule("daily");
    setWorkflowRef("main");
    setCommandsText("");
    setEnvVars([]);
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

  const addEnvVar = () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;
    setEnvVars((prev) => [
      ...prev,
      { key: newEnvKey.trim(), value: newEnvValue.trim() },
    ]);
    setNewEnvKey("");
    setNewEnvValue("");
  };

  const removeEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Snapshot Configuration</h3>
              {snapshot && (
                <Button size="sm" variant="destructive" onClick={handleDelete}>
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
                <Select
                  value={schedule}
                  onValueChange={(val) => setSchedule(val as Schedule)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(SCHEDULE_LABELS) as Array<
                        [Schedule, string]
                      >
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Workflow Branch
                </label>
                <Input
                  value={workflowRef}
                  onChange={(e) => setWorkflowRef(e.target.value)}
                  placeholder="main"
                  className="h-8 text-xs"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Branch or ref where <code>rebuild-snapshot.yml</code> exists.
                  Defaults to <code>main</code> if empty.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Custom Setup Commands (one per line)
                </label>
                <Textarea
                  value={commandsText}
                  onChange={(e) => setCommandsText(e.target.value)}
                  placeholder={
                    'echo "Configuring workspace"\npnpm add -g eslint'
                  }
                  className="font-mono text-xs"
                  rows={4}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Commands run during Docker build as the <code>eva</code> user.
                  Use user-level setup commands, not root-only package installs
                  like <code>apt-get</code>.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Custom Environment Variables (baked into snapshot)
                </label>
                {envVars.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {envVars.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-xs flex-1 truncate">
                          {v.key}=*
                        </span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => removeEnvVar(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <IconX size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="KEY"
                    className="h-7 font-mono text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addEnvVar();
                    }}
                  />
                  <Input
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="value"
                    className="h-7 font-mono text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addEnvVar();
                    }}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={addEnvVar}
                    disabled={!newEnvKey.trim() || !newEnvValue.trim()}
                  >
                    <IconPlus size={14} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground">
                Requires <code className="font-mono">rebuild-template.yml</code>{" "}
                workflow on target branch +{" "}
                <code className="font-mono">E2B_API_KEY</code> secret in repo.
              </p>
              <Button size="sm" onClick={handleSave} disabled={saving}>
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
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Snapshot Name</span>
                  <p className="font-mono mt-0.5">{snapshot.snapshotName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Schedule</span>
                  <p className="mt-0.5">{SCHEDULE_LABELS[snapshot.schedule]}</p>
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
            <div className="rounded-lg border border-border/70">
              <div className="px-4 py-3 border-b border-border/60">
                <h3 className="text-sm font-medium">Build History</h3>
              </div>
              <table className="w-full text-xs">
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
                        repoFullName={fullName}
                        onToggle={() =>
                          setExpandedBuild(isExpanded ? null : build._id)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
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
