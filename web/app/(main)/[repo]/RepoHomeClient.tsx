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
import Link from "next/link";
import Image from "next/image"

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
    <Card shadow="none" className="bg-neutral-50 dark:bg-neutral-800/50">
      <CardBody className="p-4 gap-3">
        <Icon size={20} className="text-neutral-400 dark:text-neutral-500" />
        <div>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">
            {value}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {label}
          </p>
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
      <div className="w-full max-w-lg space-y-4">
        <div
          className={`flex items-center gap-1.5 bg-gradient-to-r from-teal-200/50 to-cyan-200/50 dark:from-teal-800 dark:to-cyan-800 rounded-full pr-4 w-max`}
        >
          <Image
            src="/icon.png"
            alt="Eva"
            width={33}
            height={33}
            className="rounded-full"
          />
          <span className="text-xl tracking-tight font-semibold text-teal-800 dark:text-teal-100">
            Eva's Stats
          </span>
        </div>
        <p className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
          {repo.owner}/{repo.name}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={IconGitPullRequest}
            label="PRs Shipped"
            value={impactStats.prsShipped}
          />
          <StatCard
            icon={IconPercentage}
            label="Ship Rate"
            value={impactStats.shipRate + "%"}
          />
          <StatCard
            icon={IconUsers}
            label="Prompting Now"
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
