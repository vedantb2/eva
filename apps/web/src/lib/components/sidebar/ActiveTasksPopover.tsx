"use client";

import { HoverCard, HoverCardTrigger, HoverCardContent } from "@eva/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { IconListCheck } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { entityPathSegment } from "@/lib/numId";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
import {
  SidebarActivityBadge,
  SidebarActivityBusyGlyph,
  SidebarActivityHeader,
  SidebarActivityRow,
  SidebarActivitySandboxGlyph,
  SidebarActivitySection,
} from "@/lib/components/sidebar/_components/SidebarActivityHoverCard";

interface ActiveTasksBadgeProps {
  repoId: Id<"githubRepos">;
  basePath: string;
}

export function ActiveTasksBadge({ repoId, basePath }: ActiveTasksBadgeProps) {
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const quickTasks = allTasks?.filter((t) => !t.projectId) ?? [];
  const runningTasks = quickTasks.filter((t) => t.status === "in_progress");
  const sandboxTasks = quickTasks.filter(
    (t) =>
      t.reviewTaskSandboxStatus === "active" ||
      t.reviewTaskSandboxStatus === "starting",
  );

  if (runningTasks.length === 0 && sandboxTasks.length === 0) {
    return null;
  }

  const summaryParts: string[] = [];
  if (runningTasks.length > 0)
    summaryParts.push(`${runningTasks.length} running`);
  if (sandboxTasks.length > 0) summaryParts.push(`${sandboxTasks.length} active`);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <SidebarActivityBadge
          busyCount={runningTasks.length}
          sandboxCount={sandboxTasks.length}
        />
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-3"
      >
        <div className="space-y-4">
          <SidebarActivityHeader
            icon={<IconListCheck size={15} className="text-primary" />}
            title="Active tasks"
            summaryParts={summaryParts}
          />

          <div className="space-y-3">
            {runningTasks.length > 0 && (
              <SidebarActivitySection
                label="Running"
                count={runningTasks.length}
                glyph={<SidebarActivityBusyGlyph />}
              >
                {runningTasks.map((task) => (
                  <SidebarActivityRow
                    key={task._id}
                    title={task.title}
                    to={toInternalRepoHref(
                      `${basePath}/quick-tasks/${entityPathSegment(task) ?? ""}`,
                    )}
                    trailing={
                      task.taskNumber ? (
                        <span className="shrink-0 font-mono text-3xs text-muted-foreground/80 tabular-nums">
                          #{task.taskNumber}
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </SidebarActivitySection>
            )}

            {sandboxTasks.length > 0 && (
              <SidebarActivitySection
                label="Sandbox"
                count={sandboxTasks.length}
                glyph={<SidebarActivitySandboxGlyph />}
              >
                {sandboxTasks.map((task) => (
                  <SidebarActivityRow
                    key={task._id}
                    title={task.title}
                    to={toInternalRepoHref(
                      `${basePath}/quick-tasks/${entityPathSegment(task) ?? ""}`,
                    )}
                    trailing={
                      task.taskNumber ? (
                        <span className="shrink-0 font-mono text-3xs text-muted-foreground/80 tabular-nums">
                          #{task.taskNumber}
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </SidebarActivitySection>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
