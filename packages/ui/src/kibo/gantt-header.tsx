"use client";

import dayjs from "../utils/dayjs";
import type { FC, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../utils/cn";
import { useGanttContext, type Range } from "./gantt-provider";
import { GanttColumns } from "./gantt-timeline";

export type GanttContentHeaderProps = {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
};

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();

  return (
    <div
      className="sticky top-0 z-20 grid w-full shrink-0 bg-background/90 backdrop-blur-sm"
      style={{ height: "var(--gantt-header-height)" }}
    >
      <div>
        <div
          className="sticky inline-flex whitespace-nowrap px-3 py-2 text-muted-foreground text-xs"
          style={{ left: "var(--gantt-sidebar-width)" }}
        >
          <p>{title}</p>
        </div>
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            className="shrink-0 bg-muted/15 py-1 text-center text-xs"
            key={`${id}-${index}`}
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyHeader: FC = () => {
  const gantt = useGanttContext();

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => (
        <div className="relative flex flex-col" key={`${year.year}-${index}`}>
          <GanttContentHeader
            columns={month.days}
            renderHeaderItem={(item: number) => (
              <div className="flex items-center justify-center gap-1">
                <p>
                  {dayjs(new Date(year.year, index, 1))
                    .add(item, "day")
                    .format("D")}
                </p>
                <p className="text-muted-foreground">
                  {dayjs(new Date(year.year, index, 1))
                    .add(item, "day")
                    .format("dd")}
                </p>
              </div>
            )}
            title={dayjs(new Date(year.year, index, 1)).format("MMMM YYYY")}
          />
          <GanttColumns
            columns={month.days}
            isColumnSecondary={(item: number) => {
              const dayOfWeek = dayjs(new Date(year.year, index, 1))
                .add(item, "day")
                .day();
              return dayOfWeek === 0 || dayOfWeek === 6;
            }}
          />
        </div>
      )),
  );
};

const MonthlyHeader: FC = () => {
  const gantt = useGanttContext();

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
        renderHeaderItem={(item: number) => (
          <p>{dayjs(new Date(year.year, item, 1)).format("MMM")}</p>
        )}
        title={`${year.year}`}
      />
      <GanttColumns
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
      />
    </div>
  ));
};

const QuarterlyHeader: FC = () => {
  const gantt = useGanttContext();

  return gantt.timelineData.map((year) =>
    year.quarters.map((quarter, quarterIndex) => (
      <div
        className="relative flex flex-col"
        key={`${year.year}-${quarterIndex}`}
      >
        <GanttContentHeader
          columns={quarter.months.length}
          renderHeaderItem={(item: number) => (
            <p>
              {dayjs(new Date(year.year, quarterIndex * 3 + item, 1)).format(
                "MMM",
              )}
            </p>
          )}
          title={`Q${quarterIndex + 1} ${year.year}`}
        />
        <GanttColumns columns={quarter.months.length} />
      </div>
    )),
  );
};

const headers: Record<Range, FC> = {
  daily: DailyHeader,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader,
};

export type GanttHeaderProps = {
  className?: string;
};

export const GanttHeader: FC<GanttHeaderProps> = ({ className }) => {
  const gantt = useGanttContext();
  const Header = headers[gantt.range];

  return (
    <div className={cn("-space-x-px flex h-full w-max", className)}>
      <Header />
    </div>
  );
};
