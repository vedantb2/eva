"use client";

import { Card, CardContent, Progress } from "@conductor/ui";

interface SessionFunnelProps {
  totalSessions: number;
  sessionsWithPr: number;
  shipRate: number;
}

export function SessionFunnel({
  totalSessions,
  sessionsWithPr,
  shipRate,
}: SessionFunnelProps) {
  return (
    <Card className="shadow-none border border-border">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Session to PR Funnel
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Sessions Created</span>
              <span className="font-medium text-foreground">
                {totalSessions}
              </span>
            </div>
            <Progress value={100} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">PRs Opened</span>
              <span className="font-medium text-foreground">
                {sessionsWithPr}
              </span>
            </div>
            <Progress
              value={
                totalSessions > 0 ? (sessionsWithPr / totalSessions) * 100 : 0
              }
            />
          </div>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Ship Rate:{" "}
              <span className="font-bold text-foreground">{shipRate}%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
