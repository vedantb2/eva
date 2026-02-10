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
import { Card, CardContent } from "@conductor/ui";
import dayjs from "@/lib/dates";
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
    plugins: {
      legend: { position: "bottom" as const, labels: { usePointStyle: true } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <Card className="shadow-none border border-border">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Activity Over Time
        </h3>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
