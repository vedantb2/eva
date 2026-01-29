"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import dayjs from "@/lib/dates";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TimelineEntry {
  date: number;
  runs: number;
}

interface RunSuccessChartProps {
  timeline: TimelineEntry[];
  successCount: number;
  errorCount: number;
}

export function RunSuccessChart({ timeline, successCount, errorCount }: RunSuccessChartProps) {
  const labels = timeline.map((entry) => dayjs(entry.date).format("M/D"));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Runs",
        data: timeline.map((entry) => entry.runs),
        backgroundColor: "rgba(236, 72, 153, 0.8)",
        borderColor: "rgb(236, 72, 153)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const total = successCount + errorCount;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Run Activity</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {successRate}% success
          </span>
        </div>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
