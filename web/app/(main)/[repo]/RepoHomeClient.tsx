"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import {
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import { Icon as TablerIcon } from "@tabler/icons-react";

function MiniCard({ icon: Icon, label, value }: { icon: TablerIcon; label: string; value: string | number }) {
  return (
    <Card shadow="none" className="border border-neutral-200 dark:border-neutral-800">
      <CardBody className="p-4 flex-row items-center gap-3">
        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </CardBody>
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
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-xl space-y-4">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {repo.owner}/{repo.name}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <MiniCard icon={IconGitPullRequest} label="PRs Shipped" value={impactStats.prsShipped} />
          <MiniCard icon={IconPercentage} label="Ship Rate" value={`${impactStats.shipRate}%`} />
          <MiniCard icon={IconUsers} label="Prompting Now" value={activeUsers.count} />
          <MiniCard icon={IconChecklist} label="Tasks Done" value={impactStats.tasksCompleted} />
        </div>
      </div>
    </div>
  );
}
