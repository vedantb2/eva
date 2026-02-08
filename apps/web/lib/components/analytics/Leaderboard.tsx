"use client";

import { Card, CardContent } from "@conductor/ui";
import { IconTrophy, IconUser } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";

type LeaderboardEntry = FunctionReturnType<
  typeof api.analytics.getLeaderboard
>[number];

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const rankColors = [
  "text-yellow-500",
  "text-muted-foreground",
  "text-amber-600",
  "text-muted-foreground",
  "text-muted-foreground",
];

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <Card className="shadow-none border border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Top Contributors
          </h3>
          <div className="py-8 text-center text-muted-foreground">
            No activity yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border border-border">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Top Contributors
        </h3>
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.clerkId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className={`w-6 text-center font-bold ${rankColors[index]}`}>
                {index === 0 ? (
                  <IconTrophy size={18} className="mx-auto" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="p-2 rounded-full bg-secondary">
                <IconUser size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.fullName || "Unknown User"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {entry.prsCreated}
                  </p>
                  <p className="text-muted-foreground">PRs</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {entry.tasksCompleted}
                  </p>
                  <p className="text-muted-foreground">tasks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
