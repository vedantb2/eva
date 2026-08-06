import { Link } from "@tanstack/react-router";
import { Badge, Surface } from "@eva/ui";
import { describeCron } from "@/lib/components/CronScheduleCard";
import { SettingToggle } from "./SettingToggle";

interface SystemAutomationCardProps {
  title: string;
  description: string;
  /** Cron expression in UTC; shown in the reader's local time. */
  cronSchedule: string;
  enabled: boolean;
  /** Per-repo URL id once installed; null before the first enable. */
  numId: number | null;
  basePath: string;
  onToggle: (next: boolean) => void;
}

/**
 * One entry in the Automations Hub: an eva-managed automation the user can turn
 * on for this app but cannot edit.
 */
export function SystemAutomationCard({
  title,
  description,
  cronSchedule,
  enabled,
  numId,
  basePath,
  onToggle,
}: SystemAutomationCardProps) {
  const schedule = describeCron(cronSchedule);
  // Plain `string`: `<Link to>` is a union of known route paths.
  const href: string = `${basePath}/automations/${numId}`;

  return (
    <Surface density="none" className="flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{title}</h3>
            <Badge
              variant="outline"
              className="shrink-0 border-border bg-transparent px-1.5 py-0 text-[10px] text-muted-foreground"
            >
              System
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {schedule.valid ? schedule.text : cronSchedule}
      </p>

      <SettingToggle
        title="Enabled"
        description="Run this automation on its schedule for this app"
        checked={enabled}
        onChange={onToggle}
      />

      {numId !== null && (
        <Link
          to={href}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          View runs
        </Link>
      )}
    </Surface>
  );
}
