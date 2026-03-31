import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc } from "@conductor/backend";
import { Button, Badge, Checkbox, Spinner, cn } from "@conductor/ui";
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";

type AutomationRun = Doc<"automationRuns">;
type Finding = NonNullable<AutomationRun["findings"]>[number];

const SEVERITY_COLORS: Record<Finding["severity"], string> = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

interface FindingsListProps {
  run: AutomationRun;
  repoOwner: string;
  repoName: string;
}

export function FindingsList({ run, repoOwner, repoName }: FindingsListProps) {
  const findings = run.findings ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const createTasks = useMutation(api.automations.createTasksFromFindings);

  const selectableFindings = findings.filter((f) => !f.taskId);
  const allSelected =
    selectableFindings.length > 0 &&
    selectableFindings.every((f) => selected.has(f.id));

  function toggleFinding(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableFindings.map((f) => f.id)));
    }
  }

  async function handleCreate(autoRun: boolean) {
    if (selected.size === 0) return;
    setIsCreating(true);
    try {
      await createTasks({
        runId: run._id,
        findingIds: Array.from(selected),
        autoRun,
      });
      setSelected(new Set());
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      {selectableFindings.length > 0 && (
        <div className="flex items-center gap-2 pb-1">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          <span className="text-xs text-muted-foreground">
            Select all ({selectableFindings.length})
          </span>
        </div>
      )}

      {findings.map((finding) => (
        <FindingRow
          key={finding.id}
          finding={finding}
          selected={selected.has(finding.id)}
          onToggle={() => toggleFinding(finding.id)}
          repoOwner={repoOwner}
          repoName={repoName}
        />
      ))}

      {selectableFindings.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={selected.size === 0 || isCreating}
            onClick={() => handleCreate(false)}
          >
            {isCreating && <Spinner size="sm" />}
            Create Tasks ({selected.size})
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0 || isCreating}
            onClick={() => handleCreate(true)}
          >
            {isCreating && <Spinner size="sm" />}
            Create & Run ({selected.size})
          </Button>
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  selected,
  onToggle,
  repoOwner,
  repoName,
}: {
  finding: Finding;
  selected: boolean;
  onToggle: () => void;
  repoOwner: string;
  repoName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasTaskCreated = finding.taskId !== undefined;
  const taskUrl = hasTaskCreated
    ? `/${repoOwner}/${repoName}/quick-tasks?taskId=${finding.taskId}`
    : null;

  return (
    <div className={cn("rounded-lg bg-muted/40 overflow-hidden")}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Checkbox
          checked={hasTaskCreated ? true : selected}
          disabled={hasTaskCreated}
          onCheckedChange={onToggle}
        />
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
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
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              SEVERITY_COLORS[finding.severity],
            )}
          >
            {finding.severity}
          </span>
          <span className="text-sm font-medium truncate">{finding.title}</span>
        </button>
        {hasTaskCreated && taskUrl && (
          <a
            href={taskUrl}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            <IconExternalLink size={12} />
            Task created
          </a>
        )}
      </div>
      {expanded && (
        <div className="px-3 pb-3 pl-10 space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {finding.description}
          </p>
          {finding.filePaths && finding.filePaths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Files
              </p>
              <div className="flex flex-wrap gap-1">
                {finding.filePaths.map((fp) => (
                  <span
                    key={fp}
                    className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                  >
                    {fp}
                  </span>
                ))}
              </div>
            </div>
          )}
          {finding.suggestedFix && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Suggested Fix
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {finding.suggestedFix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
