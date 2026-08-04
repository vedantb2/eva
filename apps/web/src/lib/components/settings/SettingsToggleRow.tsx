import { cn } from "@eva/ui";

interface SettingsToggleRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  className?: string;
}

/**
 * One preference row inside a `SettingsSection` with `bodyVariant="list"`.
 * Stack several with `divide-y divide-border` on the parent.
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
        "flex items-start justify-between gap-4 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 pt-0.5">{action}</div>
    </div>
  );
}
