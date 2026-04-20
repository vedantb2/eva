import { cn } from "@conductor/ui";

export function OptionButton({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-sm",
        active
          ? "bg-primary/8 text-foreground ring-1 ring-primary/20"
          : "bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
