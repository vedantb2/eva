"use client";

import { Icon as TablerIcon } from "@tabler/icons-react";

type ColorVariant = "pink" | "green" | "yellow" | "blue" | "neutral";

const colorClasses: Record<ColorVariant, { bg: string; icon: string }> = {
  pink: { bg: "bg-pink-50 dark:bg-pink-900/20", icon: "text-pink-600" },
  green: { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-600" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: "text-yellow-600" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600" },
  neutral: { bg: "bg-neutral-50 dark:bg-neutral-800", icon: "text-neutral-600" },
};

interface StatCardProps {
  icon: TablerIcon;
  label: string;
  value: string | number;
  color?: ColorVariant;
}

export function StatCard({ icon: Icon, label, value, color = "neutral" }: StatCardProps) {
  const colors = colorClasses[color];
  return (
    <div className={`p-4 rounded-xl ${colors.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white dark:bg-neutral-900 ${colors.icon}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
