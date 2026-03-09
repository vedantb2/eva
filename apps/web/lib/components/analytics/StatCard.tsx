"use client";

import { Card, CardContent } from "@conductor/ui";
import { Icon as TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  icon: TablerIcon;
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <Card className="motion-emphasized border border-border shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <CardContent className="flex flex-row items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="motion-base rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2">
          <Icon size={18} className="sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-foreground sm:text-2xl">
            {value}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
