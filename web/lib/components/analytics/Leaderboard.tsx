"use client";

import { Card, CardContent } from "@conductor/ui";
import { IconTrophy, IconUser } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "conductor-backend";

type LeaderboardEntry = FunctionReturnType<
  typeof api.analytics.getLeaderboard
>[number];

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const rankColors = [
  "text-yellow-500",
  "text-neutral-400",
  "text-amber-600",
  "text-neutral-500",
  "text-neutral-500",
];

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <Card className="shadow-none border border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            Top Contributors
          </h3>
          <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
            No activity yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          Top Contributors
        </h3>
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.clerkId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className={`w-6 text-center font-bold ${rankColors[index]}`}>
                {index === 0 ? (
                  <IconTrophy size={18} className="mx-auto" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <IconUser size={16} className="text-neutral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {entry.fullName || "Unknown User"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {entry.prsCreated}
                  </p>
                  <p className="text-neutral-500">PRs</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {entry.tasksCompleted}
                  </p>
                  <p className="text-neutral-500">tasks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
