interface SettingsFieldProps {
  /** Field name, shown above the control. */
  label: React.ReactNode;
  /** Help text shown under the control. */
  description?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One labelled control inside a SettingsSection body.
 *
 * Every settings form repeats the same label / control / help-text stack, so it
 * lives here rather than being re-spaced per field. Stack several inside a
 * section body with `grid gap-4`.
 */
export function SettingsField({
  label,
  description,
  children,
}: SettingsFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
