import { cn } from "@eva/ui";

type SettingsSectionBodyVariant = "form" | "list" | "compact";

const BODY_VARIANT_CLASS: Record<SettingsSectionBodyVariant, string> = {
  form: "px-4 py-5",
  list: "divide-y divide-border/50 p-0",
  compact: "px-4 py-3",
};

interface SettingsSectionProps {
  /** Section heading. Kept short — the description carries the detail. */
  title: React.ReactNode;
  /** Supporting copy shown under the heading. */
  description?: React.ReactNode;
  /** Control pinned to the top-right of the heading, e.g. a switch or link. */
  action?: React.ReactNode;
  /** Controls pinned to a bottom bar, e.g. a Save button. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Body padding contract. Prefer this over freelancing `bodyClassName` padding.
   * - form: default labelled fields
   * - list: edge-to-edge divided rows (`p-0`)
   * - compact: tighter padding for dense controls
   */
  bodyVariant?: SettingsSectionBodyVariant;
  /** Applied to the body wrapper, for one-off layout (grids, etc.). */
  bodyClassName?: string;
  className?: string;
}

/**
 * The single container for a block of settings, shared by the global and repo
 * settings routes.
 *
 * Title and description sit on the canvas above the card so they read as a
 * section caption. The card is only the controls (and optional footer).
 * Content nested inside the body should step to `bg-muted` rather than
 * `bg-card`, since the section body already occupies the card tone.
 */
export function SettingsSection({
  title,
  description,
  action,
  footer,
  children,
  bodyVariant = "form",
  bodyClassName,
  className,
}: SettingsSectionProps) {
  const hasBody = children != null;
  const hasCard = hasBody || footer != null;

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <header className="flex items-start justify-between gap-4 px-4">
        <div className="min-w-0">
          <h3 className="text-balance text-sm font-semibold text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {hasCard ? (
        <div
          className={cn(
            "rounded-surface bg-card [&_input]:bg-muted [&_textarea]:bg-muted [&_[data-slot=select-trigger]]:bg-muted [&_[role=combobox]]:border-input [&_[role=combobox]]:bg-muted",
            bodyVariant === "list" && "overflow-hidden",
          )}
        >
          {hasBody ? (
            <div className={cn(BODY_VARIANT_CLASS[bodyVariant], bodyClassName)}>
              {children}
            </div>
          ) : null}
          {footer ? (
            <div className="flex items-center justify-end gap-2 rounded-b-surface bg-muted px-4 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
