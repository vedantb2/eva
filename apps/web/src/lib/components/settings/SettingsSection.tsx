import { cn } from "@eva/ui";

interface SettingsSectionProps {
  /** Section heading. Kept short — the description carries the detail. */
  title: React.ReactNode;
  /** Supporting copy shown under the heading. */
  description?: React.ReactNode;
  /** Control pinned to the top-right of the header, e.g. a switch or link. */
  action?: React.ReactNode;
  /** Controls pinned to a bottom bar, e.g. a Save button. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Applied to the body wrapper, for sections that need edge-to-edge content. */
  bodyClassName?: string;
  className?: string;
}

/**
 * The single container for a block of settings, shared by the global and repo
 * settings routes.
 *
 * Every settings page is a vertical stack of these, so the page reads as a set
 * of hairline-bordered cards on the canvas rather than free-floating text. The
 * header, body, and footer are separated by hairline dividers (structural
 * separation), while grouping inside the body is left to whitespace.
 *
 * Content nested inside the body should step to `bg-muted` rather than
 * `bg-card`, since the section itself already occupies the card tone.
 */
export function SettingsSection({
  title,
  description,
  action,
  footer,
  children,
  bodyClassName,
  className,
}: SettingsSectionProps) {
  const hasBody = children != null;

  return (
    <section
      className={cn("rounded-surface bg-card smooth-shadow-ring-sm", className)}
    >
      <header
        className={cn(
          "flex items-start justify-between gap-4 px-4 py-3",
          hasBody && "border-b border-border",
        )}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {hasBody ? (
        <div className={cn("px-4 py-4", bodyClassName)}>{children}</div>
      ) : null}

      {footer ? (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
