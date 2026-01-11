"use client";

import { IconFlame, IconHeart, IconBolt } from "@tabler/icons-react";

interface StatsBarProps {
  stats: {
    xp: number;
    streak: number;
    hearts: number;
  } | null | undefined;
}

export function StatsBar({ stats }: StatsBarProps) {
  const xp = stats?.xp ?? 0;
  const streak = stats?.streak ?? 0;
  const hearts = stats?.hearts ?? 5;

  return (
    <div className="flex items-center justify-center gap-6 py-4 px-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <IconFlame className="w-6 h-6 text-yellow-500" />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {streak}
        </span>
      </div>

      <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

      <div className="flex items-center gap-2">
        <IconBolt className="w-6 h-6 text-yellow-500" />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {xp} XP
        </span>
      </div>

      <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <IconHeart
            key={i}
            className={`w-5 h-5 ${
              i < hearts ? "text-red-500 fill-red-500" : "text-neutral-300 dark:text-neutral-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
