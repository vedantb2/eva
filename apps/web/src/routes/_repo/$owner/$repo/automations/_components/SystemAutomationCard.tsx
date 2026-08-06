import { Link } from "@tanstack/react-router";
import { Badge, Button, Surface } from "@eva/ui";
import { IconCheck, IconDownload } from "@tabler/icons-react";
import { describeCron } from "@/lib/components/CronScheduleCard";

interface SystemAutomationCardProps {
  title: string;
  description: string;
  /** Cron expression in UTC; shown in the reader's local time. */
  cronSchedule: string;
  installed: boolean;
  /** Per-repo URL id once installed; null otherwise. */
  numId: number | null;
  basePath: string;
  onInstall: () => void;
  onUninstall: () => void;
}

/**
 * One entry in the Automations Hub: an eva-managed automation the user installs
 * into this app. Installing adds it to the app's automations (where it can be
 * enabled, disabled and run); uninstalling takes it back out.
 */
export function SystemAutomationCard({
  title,
  description,
  cronSchedule,
  installed,
  numId,
  basePath,
  onInstall,
  onUninstall,
}: SystemAutomationCardProps) {
  const schedule = describeCron(cronSchedule);
  // Plain `string`: `<Link to>` is a union of known route paths.
  const href: string = `${basePath}/automations/${numId}`;

  return (
    <Surface density="none" className="flex flex-col gap-3 p-3 sm:p-4">
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

      <p className="text-[11px] text-muted-foreground">
        {schedule.valid ? schedule.text : cronSchedule}
      </p>

      <div className="mt-auto flex items-center gap-2">
        {installed ? (
          <>
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              <IconCheck size={13} />
              Installed
            </span>
            {numId !== null && (
              <Link
                to={href}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Open
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={onUninstall}
            >
              Uninstall
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onInstall}>
            <IconDownload size={14} />
            Install
          </Button>
        )}
      </div>
    </Surface>
  );
}
