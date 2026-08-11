import type { ReactNode } from "react";

/**
 * Detail-page field rows: one field per row, label above the group. Shared by
 * the task Properties column and the project Overview column so the two
 * surfaces cannot drift apart.
 */

/** Ghost `SelectTrigger` for a field row — full width, no border, hover fill. */
export const FIELD_TRIGGER_CLASS =
  "h-10 border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-lg text-[13px] [&>svg:last-child]:hidden";

/** Row wrapper for fields that are not a Select (toggles, read-only values). */
export const FIELD_ROW_CLASS =
  "flex items-center min-h-10 rounded-lg px-2 transition-colors hover:bg-muted/50";

export function FieldsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
