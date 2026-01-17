"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TaskStatusChartProps {
  data: {
    todo: number;
    in_progress: number;
    code_review: number;
    done: number;
  };
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = {
    labels: ["Todo", "In Progress", "Code Review", "Done"],
    datasets: [
      {
        data: [data.todo, data.in_progress, data.code_review, data.done],
        backgroundColor: [
          "rgba(115, 115, 115, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
        borderColor: [
          "rgb(115, 115, 115)",
          "rgb(234, 179, 8)",
          "rgb(168, 85, 247)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
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
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Task Status</h3>
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
