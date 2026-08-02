import { cn } from "@eva/ui";

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

/**
 * A labelled on/off switch row used across the automation settings cards
 * (Share, Report Only, Actions, Send email). Wrap in a `rounded-surface border border-border bg-muted/40`
 * card at the call site for surface grouping.
 */
export function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
