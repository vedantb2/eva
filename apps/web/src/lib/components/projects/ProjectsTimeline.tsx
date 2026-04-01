"use client";

import { useMemo, useCallback } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "@conductor/shared/dates";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  type GanttFeature,
  type GanttStatus,
} from "@conductor/ui";
import {
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";

type Project = FunctionReturnType<typeof api.projects.list>[number];

interface ProjectsTimelineProps {
  projects: Project[];
  basePath: string;
}

const phaseStatusMap: Record<ProjectPhase, GanttStatus> = {
  draft: { id: "draft", name: "Draft", color: "rgb(115 115 115 / 0.5)" },
  finalized: { id: "finalized", name: "Finalized", color: "rgb(59 130 246)" },
  active: {
    id: "active",
    name: "Active",
    color: "hsl(var(--status-progress-bar))",
  },
  completed: {
    id: "completed",
    name: "Completed",
    color: "hsl(var(--status-done-bar))",
  },
  cancelled: {
    id: "cancelled",
    name: "Cancelled",
    color: "hsl(var(--status-cancelled-bar))",
  },
};

export function ProjectsTimeline({
  projects,
  basePath,
}: ProjectsTimelineProps) {
  const navigate = useNavigate();
  const updateProject = useMutation(api.projects.update);

  const { features, unscheduledCount, projectIdMap, phaseMap } = useMemo(() => {
    const scheduled: GanttFeature[] = [];
    const idMap = new Map<string, Id<"projects">>();
    const phases = new Map<string, ProjectPhase>();
    let unscheduled = 0;

    for (const project of projects) {
      if (project.projectStartDate && project.projectEndDate) {
        idMap.set(project._id, project._id);
        phases.set(project._id, project.phase);
        scheduled.push({
          id: project._id,
          name: project.title,
          startAt: new Date(project.projectStartDate),
          endAt: new Date(project.projectEndDate),
          status: phaseStatusMap[project.phase],
        });
      } else {
        unscheduled++;
      }
    }

    return {
      features: scheduled,
      unscheduledCount: unscheduled,
      projectIdMap: idMap,
      phaseMap: phases,
    };
  }, [projects]);

  const handleSelectItem = useCallback(
    (id: string) => {
      navigate({ to: `${basePath}/projects/${id}` });
    },
    [navigate, basePath],
  );

  const handleMove = useCallback(
    (id: string, startAt: Date, endAt: Date | null) => {
      if (!endAt) return;
      const projectId = projectIdMap.get(id);
      if (!projectId) return;
      updateProject({
        id: projectId,
        projectStartDate: startAt.getTime(),
        projectEndDate: endAt.getTime(),
      });
    },
    [updateProject, projectIdMap],
  );

  if (projects.length === 0) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 animate-in fade-in duration-300">
      {features.length > 0 && (
        <GanttProvider range="monthly" zoom={100} className="flex-1 min-h-0">
          <GanttSidebar>
            <GanttSidebarGroup name="Projects">
              {features.map((feature) => (
                <GanttSidebarItem
                  key={feature.id}
                  feature={feature}
                  onSelectItem={handleSelectItem}
                />
              ))}
            </GanttSidebarGroup>
          </GanttSidebar>
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              <GanttFeatureListGroup>
                {features.map((feature) => {
                  const phase = phaseMap.get(feature.id) ?? "draft";
                  const config = phaseConfig[phase];
                  const durationDays = Math.max(
                    1,
                    dayjs(feature.endAt).diff(dayjs(feature.startAt), "day") +
                      1,
                  );

                  return (
                    <div className="flex" key={feature.id}>
                      <button
                        onClick={() => handleSelectItem(feature.id)}
                        type="button"
                        className="contents"
                      >
                        <GanttFeatureItem {...feature} onMove={handleMove}>
                          <div
                            className={`absolute inset-y-0 left-0 w-1 rounded-l-md ${config.bar}`}
                          />
                          <p
                            className={`flex-1 truncate pl-2 text-xs font-medium ${config.text}`}
                          >
                            {feature.name}
                          </p>
                          <span className="ml-auto rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">
                            {durationDays}d
                          </span>
                        </GanttFeatureItem>
                      </button>
                    </div>
                  );
                })}
              </GanttFeatureListGroup>
            </GanttFeatureList>
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      )}

      {unscheduledCount > 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {unscheduledCount} unscheduled{" "}
          {unscheduledCount === 1 ? "project" : "projects"}
        </p>
      )}
    </div>
  );
}
