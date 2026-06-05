"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Widget } from "@/lib/components/Widget";
import dayjs from "@conductor/shared/dates";
import { cssColor } from "@/lib/utils/cssColor";

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
        backgroundColor: cssColor("chart-1", 0.8),
        borderColor: cssColor("chart-1"),
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
    <Widget title="PRs Shipped Over Time">
      <div className="h-48 sm:h-64">
        <Bar data={chartData} options={options} />
      </div>
    </Widget>
  );
}
