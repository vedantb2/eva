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
import Link from "next/link";
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
    <Card className="bg-secondary">
      <CardContent className="p-5 flex flex-col gap-2.5">
        <Icon size={24} className="text-muted-foreground" />
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
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-1.5 w-max">
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
        <p className="text-sm font-medium text-muted-foreground">
          {repo.owner}/{repo.name}
        </p>
        <div className="grid grid-cols-2 gap-4">
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
