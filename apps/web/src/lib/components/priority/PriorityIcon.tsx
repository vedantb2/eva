import { cn } from "@conductor/ui";
import type { Priority } from "./priorityMeta";

interface PriorityIconProps {
  level: Priority | undefined;
  size?: number;
  className?: string;
}

export function PriorityIcon({
  level,
  size = 16,
  className,
}: PriorityIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {renderShape(level)}
    </svg>
  );
}

function renderShape(level: Priority | undefined) {
  if (level === undefined) {
    return (
      <>
        <rect
          x={2}
          y={7.25}
          width={3}
          height={1.5}
          rx={0.5}
          className="fill-muted-foreground/60"
        />
        <rect
          x={6.5}
          y={7.25}
          width={3}
          height={1.5}
          rx={0.5}
          className="fill-muted-foreground/60"
        />
        <rect
          x={11}
          y={7.25}
          width={3}
          height={1.5}
          rx={0.5}
          className="fill-muted-foreground/60"
        />
      </>
    );
  }

  if (level === "urgent") {
    return (
      <>
        <rect
          x={1}
          y={1}
          width={14}
          height={14}
          rx={3}
          className="fill-orange-500"
        />
        <rect
          x={7.25}
          y={4}
          width={1.5}
          height={5}
          rx={0.5}
          className="fill-white"
        />
        <rect
          x={7.25}
          y={10.5}
          width={1.5}
          height={1.5}
          rx={0.5}
          className="fill-white"
        />
      </>
    );
  }

  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const bars = [
    { x: 2, y: 11, h: 3 },
    { x: 6.5, y: 8, h: 6 },
    { x: 11, y: 5, h: 9 },
  ];
  return (
    <>
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={3}
          height={bar.h}
          rx={0.5}
          className={
            i < filled ? "fill-foreground" : "fill-muted-foreground/30"
          }
        />
      ))}
    </>
  );
}
