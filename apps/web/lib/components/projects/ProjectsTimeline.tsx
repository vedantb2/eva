"use client";

import {
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import { useRouter } from "next/navigation";
import {
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";

import { Button, cn } from "@conductor/ui";

type Project = FunctionReturnType<typeof api.projects.list>[number];

const DAY_MS = 86_400_000;
const LABEL_WIDTH_SM = 140;
const LABEL_WIDTH_DEFAULT = 208;
const ROW_HEIGHT = 42;

const SM_BREAKPOINT = 640;
const smQuery =
  typeof window !== "undefined"
    ? window.matchMedia(`(min-width: ${SM_BREAKPOINT}px)`)
    : null;
function subscribeSmQuery(cb: () => void) {
  smQuery?.addEventListener("change", cb);
  return () => smQuery?.removeEventListener("change", cb);
}
function getSmSnapshot() {
  return smQuery?.matches ?? true;
}
function getSmServerSnapshot() {
  return true;
}
const MIN_PX_PER_DAY = 8;
const MAX_PX_PER_DAY = 80;
const DEFAULT_PX_PER_DAY = 24;
const ZOOM_FACTOR = 1.2;
const DRAG_THRESHOLD_PX = 4;
const EDGE_EXPAND_DAYS = 180;
const EDGE_EXPAND_THRESHOLD_PX = 240;

interface DragState {
  startX: number;
  startScroll: number;
  moved: boolean;
  pointerId: number;
}

interface ProjectsTimelineProps {
  projects: Project[];
  basePath: string;
}

export function ProjectsTimeline({
  projects,
  basePath,
}: ProjectsTimelineProps) {
  const router = useRouter();

  const isSmUp = useSyncExternalStore(
    subscribeSmQuery,
    getSmSnapshot,
    getSmServerSnapshot,
  );
  const LABEL_WIDTH = isSmUp ? LABEL_WIDTH_DEFAULT : LABEL_WIDTH_SM;

  const containerRef = useRef<HTMLDivElement>(null);
  const [pxPerDay, setPxPerDay] = useState(DEFAULT_PX_PER_DAY);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [extraSpanDays, setExtraSpanDays] = useState({ left: 0, right: 0 });
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const hasAutoCenteredRef = useRef(false);

  const { withDates, withoutDates, baseOriginDate, baseSpanDays } =
    useMemo(() => {
      const dated = projects.filter(
        (project) => project.projectStartDate && project.projectEndDate,
      );
      const undated = projects.filter(
        (project) => !project.projectStartDate || !project.projectEndDate,
      );

      if (dated.length === 0) {
        return {
          withDates: [],
          withoutDates: undated,
          baseOriginDate: 0,
          baseSpanDays: 0,
        };
      }

      const allDates = dated.flatMap((project) => {
        return [project.projectStartDate!, project.projectEndDate!];
      });
      const today = Date.now();
      const minDate = Math.min(...allDates, today);
      const maxDate = Math.max(...allDates, today);
      const spanDays = Math.max(1, Math.ceil((maxDate - minDate) / DAY_MS) + 1);
      const paddingDays = Math.min(
        60,
        Math.max(14, Math.ceil(spanDays * 0.15)),
      );
      const origin = minDate - paddingDays * DAY_MS;
      const span = spanDays + paddingDays * 2;

      return {
        withDates: dated,
        withoutDates: undated,
        baseOriginDate: origin,
        baseSpanDays: span,
      };
    }, [projects]);

  const originDate =
    baseSpanDays === 0 ? 0 : baseOriginDate - extraSpanDays.left * DAY_MS;
  const totalSpanDays =
    baseSpanDays === 0
      ? 0
      : baseSpanDays + extraSpanDays.left + extraSpanDays.right;
  const totalWidth = totalSpanDays * pxPerDay;

  const clampScroll = useCallback(
    (next: number, width = totalWidth) => {
      const container = containerRef.current;
      if (!container) return Math.max(0, next);
      const viewportWidth = Math.max(0, container.clientWidth - LABEL_WIDTH);
      const maxScroll = Math.max(0, width - viewportWidth);
      return Math.min(Math.max(0, next), maxScroll);
    },
    [totalWidth, LABEL_WIDTH],
  );

  const setClampedScroll = useCallback(
    (next: number | ((prev: number) => number), width?: number) => {
      setScrollLeft((prev) => {
        const raw = typeof next === "function" ? next(prev) : next;
        return clampScroll(raw, width ?? totalWidth);
      });
    },
    [clampScroll, totalWidth],
  );

  const scrollToToday = useCallback(() => {
    if (!containerRef.current || totalSpanDays === 0) return;
    const todayOffset = ((Date.now() - originDate) / DAY_MS) * pxPerDay;
    const viewWidth = Math.max(
      0,
      containerRef.current.clientWidth - LABEL_WIDTH,
    );
    setClampedScroll(todayOffset - viewWidth / 2);
  }, [originDate, pxPerDay, setClampedScroll, totalSpanDays, LABEL_WIDTH]);

  const setZoom = useCallback(
    (nextZoom: number, anchorX?: number) => {
      const clampedZoom = Math.min(
        MAX_PX_PER_DAY,
        Math.max(MIN_PX_PER_DAY, nextZoom),
      );
      if (clampedZoom === pxPerDay) return;

      const container = containerRef.current;
      if (!container) {
        setPxPerDay(clampedZoom);
        return;
      }

      const viewportWidth = Math.max(0, container.clientWidth - LABEL_WIDTH);
      const anchor = anchorX ?? viewportWidth / 2;
      const dayAtAnchor = (scrollLeft + anchor) / pxPerDay;
      const nextTotalWidth = totalSpanDays * clampedZoom;
      const nextScroll = dayAtAnchor * clampedZoom - anchor;

      setPxPerDay(clampedZoom);
      setClampedScroll(nextScroll, nextTotalWidth);
    },
    [pxPerDay, scrollLeft, setClampedScroll, totalSpanDays, LABEL_WIDTH],
  );

  useEffect(() => {
    setClampedScroll((prev) => prev);
  }, [setClampedScroll, totalWidth]);

  useEffect(() => {
    setExtraSpanDays({ left: 0, right: 0 });
    hasAutoCenteredRef.current = false;
  }, [baseOriginDate, baseSpanDays]);

  useEffect(() => {
    if (totalSpanDays === 0 || hasAutoCenteredRef.current) return;
    hasAutoCenteredRef.current = true;
    const raf = requestAnimationFrame(() => {
      scrollToToday();
    });
    // Keep first render centered to current date after layout is measured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => cancelAnimationFrame(raf);
  }, [scrollToToday, totalSpanDays]);

  useEffect(() => {
    if (totalSpanDays === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const viewportWidth = Math.max(0, container.clientWidth - LABEL_WIDTH);
    const maxScroll = Math.max(0, totalWidth - viewportWidth);
    const thresholdPx = Math.max(
      EDGE_EXPAND_THRESHOLD_PX,
      Math.round(viewportWidth * 0.2),
    );

    if (scrollLeft <= thresholdPx) {
      const deltaPx = EDGE_EXPAND_DAYS * pxPerDay;
      const nextTotalWidth = (totalSpanDays + EDGE_EXPAND_DAYS) * pxPerDay;
      const nextMaxScroll = Math.max(0, nextTotalWidth - viewportWidth);
      const nextScrollLeft = Math.min(scrollLeft + deltaPx, nextMaxScroll);
      const appliedDelta = nextScrollLeft - scrollLeft;
      setExtraSpanDays((prev) => ({
        left: prev.left + EDGE_EXPAND_DAYS,
        right: prev.right,
      }));
      setScrollLeft(nextScrollLeft);
      if (dragRef.current) {
        dragRef.current.startScroll += appliedDelta;
      }
      return;
    }

    if (maxScroll - scrollLeft <= thresholdPx) {
      setExtraSpanDays((prev) => ({
        left: prev.left,
        right: prev.right + EDGE_EXPAND_DAYS,
      }));
    }
  }, [pxPerDay, scrollLeft, totalSpanDays, totalWidth, LABEL_WIDTH]);

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

  const dayLabelStep = useMemo(() => {
    if (pxPerDay >= 30) return 1;
    if (pxPerDay >= 18) return 2;
    if (pxPerDay >= 11) return 7;
    return 14;
  }, [pxPerDay]);

  const dayLabels = useMemo(() => {
    if (totalSpanDays === 0) return [];
    const labels: { label: string; x: number }[] = [];
    for (let day = 0; day <= totalSpanDays; day += dayLabelStep) {
      const date = dayjs(originDate).add(day, "day");
      labels.push({
        label: dayLabelStep <= 2 ? date.format("D") : date.format("MMM D"),
        x: day * pxPerDay,
      });
    }
    return labels;
  }, [dayLabelStep, originDate, totalSpanDays, pxPerDay]);

  const todayX = useMemo(() => {
    if (totalSpanDays === 0) return null;
    return ((Date.now() - originDate) / DAY_MS) * pxPerDay;
  }, [originDate, totalSpanDays, pxPerDay]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const isHorizontalIntent = e.shiftKey || absX > absY * 1.2;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const viewportWidth = Math.max(0, container.clientWidth - LABEL_WIDTH);
        const viewportX = Math.min(
          viewportWidth,
          Math.max(0, e.clientX - rect.left - LABEL_WIDTH),
        );
        const delta = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
        setZoom(pxPerDay * delta, viewportX);
        return;
      }

      if (isHorizontalIntent) {
        e.preventDefault();
        const delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        setClampedScroll((prev) => prev + delta);
        return;
      }

      // Default wheel behavior on timeline: vertical wheel zooms in/out.
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportWidth = Math.max(0, container.clientWidth - LABEL_WIDTH);
      const viewportX = Math.min(
        viewportWidth,
        Math.max(0, e.clientX - rect.left - LABEL_WIDTH),
      );
      const delta = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
      setZoom(pxPerDay * delta, viewportX);
    },
    [pxPerDay, setClampedScroll, setZoom, LABEL_WIDTH],
  );

  const finishDrag = useCallback((pointerId?: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (pointerId !== undefined && drag.pointerId !== pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      requestAnimationFrame(() => {
        suppressClickRef.current = false;
      });
    }
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (dragRef.current) return;
      dragRef.current = {
        startX: e.clientX,
        startScroll: scrollLeft,
        moved: false,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [scrollLeft],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const movement = Math.abs(drag.startX - e.clientX);
      if (movement > DRAG_THRESHOLD_PX) {
        drag.moved = true;
      }
      const dx = drag.startX - e.clientX;
      setClampedScroll(drag.startScroll + dx);
    },
    [setClampedScroll],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      finishDrag(e.pointerId);
    },
    [finishDrag],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishDrag(e.pointerId);
    },
    [finishDrag],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishDrag(e.pointerId);
    },
    [finishDrag],
  );

  const openProject = useCallback(
    (projectId: Id<"projects">) => {
      if (suppressClickRef.current) return;
      router.push(`${basePath}/projects/${projectId}`);
    },
    [router, basePath],
  );

  if (projects.length === 0) return null;

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 animate-in fade-in duration-300">
        {withDates.length > 0 && (
          <div
            ref={containerRef}
            className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg bg-muted/40 select-none"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handleLostPointerCapture}
          >
            {todayX !== null && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20 transition-[left] duration-200 ease-out"
                style={{ left: todayX - scrollLeft + LABEL_WIDTH }}
              >
                <div className="absolute inset-y-0 left-0 w-px bg-primary/40" />
                <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Today
                </div>
              </div>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex pb-6 bg-background/55">
                <div
                  className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2"
                  style={{ width: LABEL_WIDTH }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Project
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToToday();
                    }}
                  >
                    Today
                  </Button>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div
                    className="relative bg-gradient-to-b from-muted/30 to-transparent transition-transform duration-200 ease-out"
                    style={{
                      width: totalWidth,
                      transform: `translateX(-${scrollLeft}px)`,
                    }}
                  >
                    <div className="relative h-7">
                      {monthLabels.map((month, index) => (
                        <div
                          key={`${month.label}-${index}`}
                          className="absolute flex h-full items-center truncate px-2 text-[10px] font-semibold text-foreground/70 transition-[left,width] duration-200 ease-out"
                          style={{ left: month.x, width: month.width }}
                        >
                          {month.label}
                        </div>
                      ))}
                    </div>
                    <div className="relative h-6 pt-1">
                      {dayLabels.map((day, index) => (
                        <span
                          key={`${day.label}-${index}`}
                          className="absolute whitespace-nowrap px-1 text-[10px] text-muted-foreground transition-[left] duration-200 ease-out"
                          style={{ left: day.x }}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 min-w-0 overflow-y-auto scrollbar">
                {withDates.map((project, index) => {
                  const start = project.projectStartDate!;
                  const end = project.projectEndDate!;
                  const barLeft = ((start - originDate) / DAY_MS) * pxPerDay;
                  const barWidth = Math.max(
                    ((end - start) / DAY_MS) * pxPerDay,
                    6,
                  );
                  const phase = project.phase as ProjectPhase;
                  const config = phaseConfig[phase];
                  const durationDays = Math.max(
                    1,
                    Math.round((end - start) / DAY_MS) + 1,
                  );
                  const showRangeLabel = barWidth > 74;
                  const showDuration = barWidth > 126;

                  return (
                    <div
                      key={project._id}
                      className={cn(
                        "group flex items-center animate-in fade-in duration-300",
                        index % 2 === 0
                          ? "bg-background/25"
                          : "bg-background/10",
                      )}
                      style={{ height: ROW_HEIGHT }}
                    >
                      <button
                        className="motion-base flex h-full shrink-0 items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                        style={{ width: LABEL_WIDTH }}
                        onClick={() => openProject(project._id)}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            config.bar,
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {project.title}
                        </span>
                      </button>

                      <div
                        className="relative h-full min-w-0 flex-1 overflow-hidden"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <div
                          className="relative h-full transition-transform duration-200 ease-out"
                          style={{
                            width: totalWidth,
                            transform: `translateX(-${scrollLeft}px)`,
                          }}
                        >
                          <button
                            className={cn(
                              "absolute top-1/2 flex -translate-y-1/2 items-center gap-1 overflow-hidden rounded-md bg-card/95 pr-1.5 transition-[left,width,transform,filter] duration-200 ease-out hover:scale-[1.01] hover:brightness-95",
                              config.bg,
                            )}
                            style={{
                              left: barLeft,
                              width: barWidth,
                              height: ROW_HEIGHT - 16,
                            }}
                            onClick={() => openProject(project._id)}
                          >
                            <span
                              className={cn(
                                "absolute inset-y-0 left-0 w-1 rounded-l-md",
                                config.bar,
                              )}
                            />
                            {showRangeLabel && (
                              <span
                                className={cn(
                                  "truncate pl-2 text-[11px] font-medium",
                                  config.text,
                                )}
                              >
                                {dayjs(start).format("MMM D")} -{" "}
                                {dayjs(end).format("MMM D")}
                              </span>
                            )}
                            {showDuration && (
                              <span className="ml-auto rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">
                                {durationDays}d
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {withoutDates.length > 0 && (
          <div
            className={cn(
              "rounded-lg bg-muted/30 p-3",
              withDates.length > 0
                ? "max-h-56 flex-shrink-0 overflow-y-auto scrollbar"
                : "min-h-0 flex-1 overflow-y-auto",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Unscheduled Projects
              </p>
              <span className="text-xs text-muted-foreground">
                {withoutDates.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {withoutDates.map((project) => {
                const phase = project.phase as ProjectPhase;
                const config = phaseConfig[phase];
                return (
                  <button
                    key={project._id}
                    className="motion-base flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-left transition-[transform,background-color] hover:-translate-y-[1px] hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    onClick={() => openProject(project._id)}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        config.bar,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {project.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
