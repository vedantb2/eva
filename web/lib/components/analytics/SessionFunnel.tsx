"use client";

import { Card, CardContent } from "@/lib/components/ui/card";
import { Progress } from "@/lib/components/ui/progress";

interface SessionFunnelProps {
  totalSessions: number;
  sessionsWithPr: number;
  shipRate: number;
}

export function SessionFunnel({ totalSessions, sessionsWithPr, shipRate }: SessionFunnelProps) {
  return (
    <Card className="shadow-none border border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Session to PR Funnel
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-600 dark:text-neutral-400">Sessions Created</span>
              <span className="font-medium text-neutral-900 dark:text-white">{totalSessions}</span>
            </div>
            <Progress value={100} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-600 dark:text-neutral-400">PRs Opened</span>
              <span className="font-medium text-neutral-900 dark:text-white">{sessionsWithPr}</span>
            </div>
            <Progress
              value={totalSessions > 0 ? (sessionsWithPr / totalSessions) * 100 : 0}
            />
          </div>
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Ship Rate:{" "}
              <span className="font-bold text-neutral-900 dark:text-white">{shipRate}%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
