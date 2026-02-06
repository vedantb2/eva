"use client";

import { Card, CardContent } from "@/lib/components/ui/card";
import { Icon as TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  icon: TablerIcon;
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle }: StatCardProps) {
  return (
    <Card className="shadow-none border border-neutral-200 dark:border-neutral-800">
      <CardContent className="flex-row items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          {subtitle && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
