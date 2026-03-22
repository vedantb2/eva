export function Sparkline({
  values,
  toneClassName,
}: {
  values: number[];
  toneClassName: string;
}) {
  const points =
    values.length === 0
      ? [0, 0]
      : values.length === 1
        ? [values[0], values[0]]
        : values;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min;
  const width = 96;
  const height = 34;
  const padding = 2;
  const linePoints = points
    .map((value, index) => {
      const x =
        padding + (index / (points.length - 1)) * (width - padding * 2);
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`;

  return (
    <div className={`h-[34px] w-24 ${toneClassName}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <polyline
          points={areaPoints}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="none"
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.9}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
