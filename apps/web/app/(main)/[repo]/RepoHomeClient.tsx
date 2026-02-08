"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Spinner, Card, CardContent } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconPercentage,
  IconUsers,
  IconChecklist,
} from "@tabler/icons-react";
import { Icon as TablerIcon } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

function Sparkline({ points, id }: { points: number[]; id: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const h = 48;
  const w = 120;
  const step = w / (points.length - 1);

  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");

  const gradientId = "spark-" + id;

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0.5" y1="0" x2="1" y2="0">
          <stop
            offset="0%"
            className="[stop-color:var(--muted-foreground)]"
            stopOpacity={0.3}
          />
          <stop
            offset="100%"
            className="[stop-color:var(--muted-foreground)]"
            stopOpacity={0.6}
          />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={"url(#" + gradientId + ")"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function seededPoints(seed: number): number[] {
  let s = seed + 1;
  return Array.from({ length: 7 }, () => {
    s = (s * 16807 + 5) % 2147483647;
    return s % 100;
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  seed,
  color,
}: {
  icon: TablerIcon;
  label: string;
  value: string | number;
  seed: number;
  color: string;
}) {
  return (
    <Card className="shadow-none bg-secondary">
      <CardContent className="p-6 flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-3 min-w-0">
          <Icon size={24} className="text-muted-foreground" />
          <div>
            <p className="text-3xl font-semibold text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
        <Sparkline points={seededPoints(seed)} id={color} />
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
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div
          className={`flex items-center gap-1.5 bg-accent rounded-full pr-4 w-max`}
        >
          <Image
            src="/icon.png"
            alt="Eva"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-2xl tracking-tight font-semibold text-primary">
            Eva's Stats
          </span>
        </div>
        <p className="text-base font-medium text-muted-foreground">
          {repo.owner}/{repo.name}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={IconGitPullRequest}
            label="PRs Shipped"
            value={impactStats.prsShipped}
            seed={1}
            color="#14b8a6"
          />
          <StatCard
            icon={IconPercentage}
            label="Cook Rate"
            value={impactStats.shipRate + "%"}
            seed={2}
            color="#06b6d4"
          />
          <StatCard
            icon={IconUsers}
            label="Cookers Now"
            value={activeUsers.count}
            seed={3}
            color="#8b5cf6"
          />
          <StatCard
            icon={IconChecklist}
            label="Tasks Done"
            value={impactStats.tasksCompleted}
            seed={4}
            color="#f59e0b"
          />
        </div>
      </div>
    </div>
  );
}
