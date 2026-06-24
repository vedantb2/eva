import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc } from "@conductor/backend";
import {
  ActivitySteps,
  Badge,
  Button,
  useElapsedSeconds,
  formatElapsed,
} from "@conductor/ui";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconPlayerStop,
} from "@tabler/icons-react";
import { Spinner as UISpinner } from "@conductor/ui";
import dayjs from "@conductor/shared/dates";
import { formatDuration } from "@conductor/shared/duration";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { FindingsList } from "./FindingsList";

const summaryPlugins = { cjk, math, mermaid };

export function LatestRun({
  run,
  loading,
  actionsEnabled,
  repoOwner,
  repoName,
}: {
  run: Doc<"automationRuns"> | undefined;
  loading: boolean;
  actionsEnabled: boolean;
  repoOwner: string;
  repoName: string;
}) {
  const acknowledgeRun = useMutation(api.automations.acknowledgeRun);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <UISpinner size="lg" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="rounded-surface border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No runs yet. Enable the automation and wait for the cron schedule to
          trigger, or click &quot;Run Now&quot;.
        </p>
      </div>
    );
  }

  return (
    <RunAccordion
      run={run}
      actionsEnabled={actionsEnabled}
      repoOwner={repoOwner}
      repoName={repoName}
      onAcknowledge={() => acknowledgeRun({ runId: run._id })}
      defaultExpanded
    />
  );
}

export function RunHistory({
  runs,
  actionsEnabled,
  repoOwner,
  repoName,
}: {
  runs: Doc<"automationRuns">[] | undefined;
  actionsEnabled: boolean;
  repoOwner: string;
  repoName: string;
}) {
  const acknowledgeRun = useMutation(api.automations.acknowledgeRun);

  if (runs === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <UISpinner size="lg" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-surface border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No runs yet. Enable the automation and wait for the cron schedule to
          trigger, or click &quot;Run Now&quot;.
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
          actionsEnabled={actionsEnabled}
          repoOwner={repoOwner}
          repoName={repoName}
          onAcknowledge={() => acknowledgeRun({ runId: run._id })}
        />
      ))}
    </div>
  );
}

function RunAccordion({
  run,
  actionsEnabled,
  repoOwner,
  repoName,
  onAcknowledge,
  defaultExpanded,
}: {
  run: Doc<"automationRuns">;
  actionsEnabled: boolean;
  repoOwner: string;
  repoName: string;
  onAcknowledge: () => void;
  defaultExpanded?: boolean;
}) {
  const isActive = run.status === "running" || run.status === "queued";
  const [expanded, setExpanded] = useState(defaultExpanded ?? isActive);
  const cancelRun = useMutation(api.automations.cancelRun);

  const streamingEntityId = `automation-run-${run._id}`;
  const streaming = useQuery(
    api.streaming.get,
    isActive ? { entityId: streamingEntityId } : "skip",
  );

  const elapsed = useElapsedSeconds(run.startedAt, isActive);

  const badgeVariant =
    run.status === "success"
      ? "success"
      : run.status === "error"
        ? "destructive"
        : run.status === "running"
          ? "warning"
          : "secondary";

  const duration =
    run.finishedAt && run.startedAt
      ? formatDuration(run.startedAt, run.finishedAt)
      : isActive && run.startedAt
        ? formatElapsed(elapsed)
        : "";

  const liveSteps = streaming?.currentActivity
    ? parseActivitySteps(streaming.currentActivity)
    : null;
  const completedSteps = run.activityLog
    ? parseActivitySteps(run.activityLog)
    : null;

  return (
    <div className="rounded-surface border border-border bg-muted/40 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          const willExpand = !expanded;
          setExpanded(willExpand);
          if (willExpand && !run.acknowledged && !isActive) {
            onAcknowledge();
          }
        }}
        className="flex w-full flex-wrap items-center gap-2 px-3 py-3 text-left hover:bg-muted/30 transition-colors sm:flex-nowrap sm:gap-3 sm:px-4"
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
        <Badge variant={badgeVariant}>{run.status}</Badge>
        <span className="text-xs text-muted-foreground sm:text-sm">
          {dayjs(run.startedAt).format("DD/MM HH:mm")}
        </span>
        <span className="hidden flex-1 truncate text-sm font-medium sm:block">
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
        {isActive && (
          <Button
            size="sm"
            variant="destructive"
            className="shrink-0 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              cancelRun({ runId: run._id });
            }}
          >
            <IconPlayerStop size={12} />
            Stop
          </Button>
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
          <span className="shrink-0 text-xs text-success">Read</span>
        )}
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {isActive && liveSteps && (
            <ActivitySteps steps={liveSteps} isStreaming />
          )}
          {!isActive && completedSteps && (
            <ActivitySteps steps={completedSteps} />
          )}
          {actionsEnabled && run.findings && run.findings.length > 0 ? (
            <FindingsList run={run} repoOwner={repoOwner} repoName={repoName} />
          ) : (
            <>
              {actionsEnabled &&
                run.resultSummary &&
                !run.findings &&
                run.status === "success" && (
                  <div className="flex items-center gap-2 rounded-surface bg-warning/10 px-3 py-2">
                    <IconAlertTriangle
                      size={14}
                      className="shrink-0 text-warning"
                    />
                    <p className="text-xs text-warning">
                      Could not parse findings from report
                    </p>
                  </div>
                )}
              {run.resultSummary && (
                <div>
                  <Streamdown
                    className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    plugins={summaryPlugins}
                  >
                    {run.resultSummary}
                  </Streamdown>
                </div>
              )}
            </>
          )}
          {run.error && (
            <div>
              <p className="text-xs font-medium text-destructive mb-1">Error</p>
              <p className="text-sm text-destructive whitespace-pre-wrap">
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
          {!isActive && !run.resultSummary && !run.error && !completedSteps && (
            <p className="text-sm text-muted-foreground">
              No details available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
