import { Icon as TablerIcon } from "@tabler/icons-react";
import { Card, CardContent } from "@conductor/ui";
import { Sparkline } from "./Sparkline";

export function StatCard({
  icon: Icon,
  label,
  value,
  trendValues,
  trendToneClassName,
}: {
  icon: TablerIcon;
  label: string;
  value: string | number;
  trendValues: number[];
  trendToneClassName: string;
}) {
  return (
    <Card className="ui-surface-interactive h-full">
      <CardContent className="flex h-full items-center justify-between gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon size={20} className="text-primary sm:size-6 shrink-0" />
          <div>
            <p className="text-xl font-semibold text-foreground tabular-nums sm:text-2xl">
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
        <Sparkline values={trendValues} toneClassName={trendToneClassName} />
      </CardContent>
    </Card>
  );
}
