"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Widget } from "@/lib/components/Widget";
import dayjs from "@conductor/shared/dates";
import { cssColor } from "@/lib/utils/cssColor";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

interface ActivityTimelineChartProps {
  timeline: Array<{
    date: number;
    sessions: number;
    runs: number;
    tasks: number;
  }>;
}

export function ActivityTimelineChart({
  timeline,
}: ActivityTimelineChartProps) {
  const labels = timeline.map((e) => dayjs(e.date).format("M/D"));
  const chartData = {
    labels,
    datasets: [
      {
        label: "Sessions",
        data: timeline.map((e) => e.sessions),
        borderColor: cssColor("chart-2"),
        backgroundColor: cssColor("chart-2", 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: "Runs",
        data: timeline.map((e) => e.runs),
        borderColor: cssColor("chart-4"),
        backgroundColor: cssColor("chart-4", 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <Widget
      title="Activity Over Time"
      actions={
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: cssColor("chart-2") }}
            />
            Sessions
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: cssColor("chart-4") }}
            />
            Runs
          </span>
        </div>
      }
    >
      <div className="h-48 sm:h-64">
        <Line data={chartData} options={options} />
      </div>
    </Widget>
  );
}
