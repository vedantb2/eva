"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Card, CardContent } from "@/lib/components/ui/card";
import dayjs from "@/lib/dates";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface PRsOverTimeChartProps {
  timeline: Array<{ date: number; prsShipped: number }>;
}

export function PRsOverTimeChart({ timeline }: PRsOverTimeChartProps) {
  const labels = timeline.map((e) => dayjs(e.date).format("M/D"));
  const chartData = {
    labels,
    datasets: [
      {
        label: "PRs Shipped",
        data: timeline.map((e) => e.prsShipped),
        backgroundColor: "rgba(20, 184, 166, 0.8)",
        borderColor: "rgb(20, 184, 166)",
        borderWidth: 1,
        borderRadius: 4,
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
    <Card className="shadow-none border border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          PRs Shipped Over Time
        </h3>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
