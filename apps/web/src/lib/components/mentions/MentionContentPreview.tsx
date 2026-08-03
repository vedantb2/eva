import type { ReactNode } from "react";

interface MentionContentPreviewProps {
  title: string;
  children: ReactNode;
}

/** Scrollable hover preview for doc/skill mention chips. */
export function MentionContentPreview({
  title,
  children,
}: MentionContentPreviewProps) {
  return (
    // design-check-ignore-next-line — floating popover layer, not a flat surface
    <div className="w-72 rounded-surface border border-border bg-popover p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-foreground">{title}</p>
      <div className="max-h-60 overflow-y-auto scrollbar scroll-fade text-xs text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
