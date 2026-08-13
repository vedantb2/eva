import { cn } from "@eva/ui";

interface SettingsToggleRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  className?: string;
}

/**
 * One preference row inside a `SettingsSection` with `bodyVariant="list"`.
 * Put rows as direct children — the section owns the dividers.
 */
export function SettingsToggleRow({
  title,
  description,
  action,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-10 shrink-0 items-center">{action}</div>
    </div>
  );
}
