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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface FeatureData {
  id: string;
  title: string;
  tasksTotal: number;
  tasksDone: number;
}

interface FeatureProgressChartProps {
  features: FeatureData[];
}

export function FeatureProgressChart({ features }: FeatureProgressChartProps) {
  const labels = features.map((f) =>
    f.title.length > 20 ? f.title.substring(0, 20) + "..." : f.title
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Completed",
        data: features.map((f) => f.tasksDone),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Remaining",
        data: features.map((f) => f.tasksTotal - f.tasksDone),
        backgroundColor: "rgba(229, 231, 235, 0.8)",
        borderColor: "rgb(229, 231, 235)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 16,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        stacked: true,
      },
    },
  };

  if (features.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          Feature Progress
        </h3>
        <div className="h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          No features yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
        Feature Progress
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
