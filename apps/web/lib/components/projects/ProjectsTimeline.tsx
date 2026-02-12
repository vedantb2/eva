"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import {
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectCardModal } from "@/lib/components/projects/ProjectCardModal";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Tooltip, TooltipTrigger, TooltipContent, Button } from "@conductor/ui";

type Project = FunctionReturnType<typeof api.projects.list>[number];

const DAY_MS = 86400000;
const LABEL_WIDTH = 192;
const ROW_HEIGHT = 36;
const MIN_PX_PER_DAY = 8;
const MAX_PX_PER_DAY = 80;

interface ProjectsTimelineProps {
  projects: Project[];
  repoFullName: string;
}

export function ProjectsTimeline({
  projects,
  repoFullName,
}: ProjectsTimelineProps) {
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pxPerDay, setPxPerDay] = useState(30);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragRef = useRef<{ startX: number; startScroll: number } | null>(null);

  const { withDates, withoutDates, originDate, totalSpanDays } = useMemo(() => {
    const dated = projects.filter(
      (p) => p.projectStartDate && p.projectEndDate,
    );
    const undated = projects.filter(
      (p) => !p.projectStartDate || !p.projectEndDate,
    );

    if (dated.length === 0) {
      return {
        withDates: [],
        withoutDates: undated,
        originDate: 0,
        totalSpanDays: 0,
      };
    }

    const allDates = dated.flatMap((p) => {
      const d = [p.projectStartDate!, p.projectEndDate!];
      if (p.deadline) d.push(p.deadline);
      return d;
    });
    const min = Math.min(...allDates);
    const max = Math.max(...allDates);
    const padding = Math.max(Math.ceil((max - min) / DAY_MS) * 0.5, 180);
    const origin = min - padding * DAY_MS;
    const span = Math.ceil((max - origin) / DAY_MS) + padding;

    return {
      withDates: dated,
      withoutDates: undated,
      originDate: origin,
      totalSpanDays: span,
    };
  }, [projects]);

  const totalWidth = totalSpanDays * pxPerDay;

  const scrollToToday = useCallback(() => {
    if (!containerRef.current) return;
    const todayOffset = ((Date.now() - originDate) / DAY_MS) * pxPerDay;
    const viewWidth = containerRef.current.clientWidth - LABEL_WIDTH;
    setScrollLeft(Math.max(0, todayOffset - viewWidth / 2));
  }, [originDate, pxPerDay]);

  useEffect(() => {
    if (!containerRef.current || totalSpanDays === 0) return;
    scrollToToday();
  }, [totalSpanDays, originDate]);

  const monthLabels = useMemo(() => {
    if (totalSpanDays === 0) return [];
    const labels: { label: string; x: number; width: number }[] = [];
    let cursor = dayjs(originDate).startOf("month");
    const endDate = dayjs(originDate).add(totalSpanDays, "day");
    while (cursor.isBefore(endDate)) {
      const nextMonth = cursor.add(1, "month");
      const startDay = Math.max(0, cursor.diff(dayjs(originDate), "day"));
      const endDay = Math.min(
        totalSpanDays,
        nextMonth.diff(dayjs(originDate), "day"),
      );
      labels.push({
        label: cursor.format("MMM YYYY"),
        x: startDay * pxPerDay,
        width: (endDay - startDay) * pxPerDay,
      });
      cursor = nextMonth;
    }
    return labels;
  }, [originDate, totalSpanDays, pxPerDay]);

  const dayLabels = useMemo(() => {
    if (totalSpanDays === 0) return [];
    const step = 1;
    const labels: { label: string; x: number }[] = [];
    for (let d = 0; d <= totalSpanDays; d += step) {
      labels.push({
        label: dayjs(originDate).add(d, "day").format("D"),
        x: d * pxPerDay,
      });
    }
    return labels;
  }, [originDate, totalSpanDays, pxPerDay]);

  const todayX = useMemo(() => {
    if (totalSpanDays === 0) return null;
    return ((Date.now() - originDate) / DAY_MS) * pxPerDay;
  }, [originDate, totalSpanDays, pxPerDay]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - LABEL_WIDTH + scrollLeft;
        const dayAtMouse = mouseX / pxPerDay;
        const delta = e.deltaY > 0 ? 0.85 : 1.18;
        const next = Math.min(
          MAX_PX_PER_DAY,
          Math.max(MIN_PX_PER_DAY, pxPerDay * delta),
        );
        setPxPerDay(next);
        const newMouseX = dayAtMouse * next;
        setScrollLeft(
          Math.max(0, newMouseX - (e.clientX - rect.left - LABEL_WIDTH)),
        );
      } else {
        setScrollLeft((prev) => Math.max(0, prev + e.deltaX + e.deltaY));
      }
    },
    [pxPerDay, scrollLeft],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      dragRef.current = { startX: e.clientX, startScroll: scrollLeft };
      e.preventDefault();
    },
    [scrollLeft],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = dragRef.current.startX - e.clientX;
    setScrollLeft(Math.max(0, dragRef.current.startScroll + dx));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (projects.length === 0) return null;

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {withDates.length > 0 && (
          <div
            ref={containerRef}
            className="flex-1 min-h-0 overflow-hidden select-none relative"
            style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {todayX !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/30 z-20 pointer-events-none"
                style={{ left: todayX - scrollLeft + LABEL_WIDTH }}
              >
                <div className="absolute -top-1 -left-[11px] text-[9px] text-primary/50 rounded px-1">
                  Today
                </div>
              </div>
            )}
            <div className="flex border-b border-border">
              <div
                className="flex-shrink-0 flex items-end pb-1"
                style={{ width: LABEL_WIDTH }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={scrollToToday}
                >
                  Today
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <div
                  className="relative"
                  style={{
                    width: totalWidth,
                    transform: `translateX(-${scrollLeft}px)`,
                  }}
                >
                  <div className="relative h-5">
                    {monthLabels.map((m, i) => (
                      <div
                        key={i}
                        className="absolute text-[10px] font-medium text-foreground/70 border-l border-border/50 pl-1.5 truncate flex items-center"
                        style={{ left: m.x, width: m.width, height: 20 }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  <div className="relative h-5">
                    {dayLabels.map((d, i) => (
                      <span
                        key={i}
                        className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
                        style={{ left: d.x }}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="overflow-y-auto scrollbar"
              style={{ maxHeight: "calc(100% - 40px)" }}
            >
              {withDates.map((project) => {
                const start = project.projectStartDate!;
                const end = project.projectEndDate!;
                const barLeft = ((start - originDate) / DAY_MS) * pxPerDay;
                const barWidth = Math.max(
                  ((end - start) / DAY_MS) * pxPerDay,
                  4,
                );
                const phase = project.phase as ProjectPhase;
                const config = phaseConfig[phase];
                const deadlineX = project.deadline
                  ? ((project.deadline - originDate) / DAY_MS) * pxPerDay
                  : null;

                return (
                  <div
                    key={project._id}
                    className="flex items-center"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <button
                      className="flex-shrink-0 text-sm font-medium text-foreground truncate text-left pr-3 hover:text-primary transition-colors"
                      style={{ width: LABEL_WIDTH }}
                      onClick={() => setSelectedProjectId(project._id)}
                    >
                      {project.title}
                    </button>
                    <div
                      className="flex-1 overflow-hidden relative"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className="relative h-full"
                        style={{
                          width: totalWidth,
                          transform: `translateX(-${scrollLeft}px)`,
                        }}
                      >
                        <button
                          className={`absolute top-1.5 rounded-md ${config.bg} hover:brightness-95 transition-all cursor-pointer flex items-center px-2`}
                          style={{
                            left: barLeft,
                            width: barWidth,
                            height: ROW_HEIGHT - 12,
                          }}
                          onClick={() => setSelectedProjectId(project._id)}
                        >
                          <span
                            className={`text-[11px] font-medium ${config.text} truncate`}
                          >
                            {dayjs(start).format("MMM D")} –{" "}
                            {dayjs(end).format("MMM D")}
                          </span>
                        </button>
                        {deadlineX !== null && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute z-20 flex flex-col items-center"
                                style={{ left: deadlineX, top: 0, bottom: 0 }}
                              >
                                <div className="w-px h-full bg-destructive/60" />
                                <div className="absolute top-1 w-2.5 h-2.5 bg-destructive rotate-45 rounded-sm" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Deadline:{" "}
                              {dayjs(project.deadline).format("MMM D, YYYY")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {withoutDates.length > 0 && (
          <div className={withDates.length > 0 ? "mt-4 flex-shrink-0" : ""}>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              No dates set
            </p>
            <div className="space-y-1">
              {withoutDates.map((project) => {
                const phase = project.phase as ProjectPhase;
                const config = phaseConfig[phase];
                return (
                  <button
                    key={project._id}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setSelectedProjectId(project._id)}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${config.bg} flex-shrink-0`}
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {project.title}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedProjectId && (
        <ProjectCardModal
          isOpen
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          projectUrl={`/${encodeRepoSlug(repoFullName)}/projects/${selectedProjectId}`}
        />
      )}
    </>
  );
}
