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
      <CardContent className="flex flex-row items-center gap-3 p-4">
        <div className="motion-base rounded-lg bg-secondary p-2 text-muted-foreground">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
