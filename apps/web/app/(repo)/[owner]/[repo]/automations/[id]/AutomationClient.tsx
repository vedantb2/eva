"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api, CLAUDE_MODELS, type ClaudeModel } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Spinner,
  Badge,
  cn,
} from "@conductor/ui";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { formatDuration } from "@/lib/utils/formatDuration";

type Automation = Doc<"automations">;

interface AutomationClientProps {
  automation: Automation;
}

export function AutomationClient({ automation }: AutomationClientProps) {
  const updateAutomation = useMutation(api.automations.update);

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-3">
          <span>{automation.title}</span>
          <button
            type="button"
            onClick={() =>
              updateAutomation({
                id: automation._id,
                enabled: !automation.enabled,
              })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              automation.enabled ? "bg-emerald-500" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                automation.enabled ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      }
    >
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Run History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <RunHistory automationId={automation._id} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsForm automation={automation} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

function RunHistory({ automationId }: { automationId: Id<"automations"> }) {
  const runs = useQuery(api.automations.listRuns, { automationId });
  const acknowledgeRun = useMutation(api.automations.acknowledgeRun);

  if (runs === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No runs yet. Enable the automation and wait for the cron schedule to
          trigger.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <RunAccordion
          key={run._id}
          run={run}
          onAcknowledge={() => acknowledgeRun({ runId: run._id })}
        />
      ))}
    </div>
  );
}

function RunAccordion({
  run,
  onAcknowledge,
}: {
  run: Doc<"automationRuns">;
  onAcknowledge: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    run.status === "success"
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
      : run.status === "error"
        ? "bg-red-500/15 text-red-600 border-red-500/30"
        : run.status === "running"
          ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
          : "bg-amber-500/15 text-amber-600 border-amber-500/30";

  const duration =
    run.finishedAt && run.startedAt
      ? formatDuration(run.startedAt, run.finishedAt)
      : run.status === "running"
        ? "Running..."
        : "";

  return (
    <div className="rounded-lg border border-border/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        {expanded ? (
          <IconChevronDown
            size={14}
            className="shrink-0 text-muted-foreground"
          />
        ) : (
          <IconChevronRight
            size={14}
            className="shrink-0 text-muted-foreground"
          />
        )}
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium capitalize", statusColor)}
        >
          {run.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {dayjs(run.startedAt).format("DD/MM/YYYY HH:mm")}
        </span>
        <span className="flex-1 truncate text-sm font-medium">
          {run.resultSummary
            ? run.resultSummary.slice(0, 80)
            : run.error
              ? run.error.slice(0, 80)
              : ""}
        </span>
        {duration && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {duration}
          </span>
        )}
        {!run.acknowledged &&
          run.status !== "queued" &&
          run.status !== "running" && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge();
              }}
            >
              <IconCheck size={12} />
              Read
            </Button>
          )}
        {run.acknowledged && (
          <span className="shrink-0 text-xs text-emerald-600">Read</span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/70 px-4 py-3 space-y-3">
          {run.resultSummary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Summary
              </p>
              <p className="text-sm whitespace-pre-wrap">{run.resultSummary}</p>
            </div>
          )}
          {run.error && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1">Error</p>
              <p className="text-sm text-red-600 whitespace-pre-wrap">
                {run.error}
              </p>
            </div>
          )}
          {run.prUrl && (
            <div>
              <a
                href={run.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <IconExternalLink size={14} />
                View Pull Request
              </a>
            </div>
          )}
          {!run.resultSummary && !run.error && (
            <p className="text-sm text-muted-foreground">
              No details available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsForm({ automation }: { automation: Automation }) {
  const updateAutomation = useMutation(api.automations.update);
  const [title, setTitle] = useState(automation.title);
  const [description, setDescription] = useState(automation.description);
  const [cronSchedule, setCronSchedule] = useState(automation.cronSchedule);
  const [model, setModel] = useState<ClaudeModel>(automation.model ?? "sonnet");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    title !== automation.title ||
    description !== automation.description ||
    cronSchedule !== automation.cronSchedule ||
    model !== (automation.model ?? "sonnet");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAutomation({
        id: automation._id,
        title,
        description,
        cronSchedule,
        model,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <CronScheduleCard value={cronSchedule} onChange={setCronSchedule} />

      <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Description</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Title
          </label>
          <Input
            className="h-8 text-xs"
            placeholder="Automation title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <Textarea
            className="min-h-[120px] text-xs"
            placeholder="Describe what this automation should do..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            The prompt that will be executed on each run.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Model</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Claude Model
          </label>
          <Select
            value={model}
            onValueChange={(val) => {
              const found = CLAUDE_MODELS.find((m) => m === val);
              if (found) setModel(found);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLAUDE_MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving && <Spinner size="sm" />}
          Save
        </Button>
      </div>
    </div>
  );
}
