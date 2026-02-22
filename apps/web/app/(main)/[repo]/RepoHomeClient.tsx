"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Card, CardContent, Spinner } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import { Icon as TablerIcon } from "@tabler/icons-react";
import Image from "next/image";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: TablerIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="ui-surface-interactive h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <Icon size={22} className="text-primary" />
        <div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RepoHomeClient() {
  const { repo } = useRepo();

  const impactStats = useQuery(api.analytics.getImpactStats, {
    repoId: repo._id,
  });
  const activeUsers = useQuery(api.analytics.getActiveUsers, {
    repoId: repo._id,
  });

  if (impactStats === undefined || activeUsers === undefined) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl space-y-4">
        <div className="ui-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 w-max">
            <Image
              src="/icon.png"
              alt="Eva"
              width={30}
              height={30}
              className="rounded-full"
            />
            <span className="text-xl tracking-tight font-semibold text-primary">
              Eva's Stats
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {repo.owner}/{repo.name}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={IconGitPullRequest}
            label="PRs Shipped"
            value={impactStats.prsShipped}
          />
          <StatCard
            icon={IconPercentage}
            label="Cook Rate"
            value={impactStats.shipRate + "%"}
          />
          <StatCard
            icon={IconUsers}
            label="Cookers Now"
            value={activeUsers.count}
          />
          <StatCard
            icon={IconChecklist}
            label="Tasks Done"
            value={impactStats.tasksCompleted}
          />
        </div>
      </div>
    </div>
  );
}
