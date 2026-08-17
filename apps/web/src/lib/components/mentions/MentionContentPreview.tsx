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
    <div className="w-72 max-w-[calc(100vw-2rem)] rounded-surface bg-popover/95 p-3 backdrop-blur-md smooth-shadow-ring-lg">
      <p className="mb-2 text-xs font-medium text-foreground">{title}</p>
      <div className="max-h-[min(15rem,50dvh)] overflow-y-auto scrollbar scroll-fade text-xs text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
