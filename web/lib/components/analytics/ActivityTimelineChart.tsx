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
import { Card, CardBody } from "@heroui/card";
import dayjs from "@/lib/dates";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ActivityTimelineChartProps {
  timeline: Array<{ date: number; sessions: number; runs: number; tasks: number }>;
}

export function ActivityTimelineChart({ timeline }: ActivityTimelineChartProps) {
  const labels = timeline.map((e) => dayjs(e.date).format("M/D"));
  const chartData = {
    labels,
    datasets: [
      {
        label: "Sessions",
        data: timeline.map((e) => e.sessions),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Runs",
        data: timeline.map((e) => e.runs),
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
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
    <Card shadow="none" className="border border-neutral-200 dark:border-neutral-800">
      <CardBody className="p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          Activity Over Time
        </h3>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardBody>
    </Card>
  );
}
