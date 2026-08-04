import { cn } from "@eva/ui";

/**
 * Vertical rhythm for every settings page body — one gap, no page-local freelancing.
 */
export function SettingsStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
