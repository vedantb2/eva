import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { IconClipboardList, IconCode } from "@tabler/icons-react";
import type { InteractionMode } from "@eva/backend";

export function ComposerInteractionModeToggle({
  interactionMode,
  onToggle,
  disabled,
}: {
  interactionMode: InteractionMode;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const isPlan = interactionMode === "plan";
  const tooltip = isPlan
    ? "Plan mode — click to return to Build"
    : "Build mode — click to enter Plan";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={isPlan ? "secondary" : "ghost"}
          disabled={disabled}
          onClick={onToggle}
          aria-label={tooltip}
          aria-pressed={isPlan}
          className={cn(
            "h-8 gap-1 px-2 text-xs",
            isPlan && "bg-accent text-accent-foreground hover:bg-accent/80",
          )}
        >
          {isPlan ? (
            <IconClipboardList className="size-3.5" />
          ) : (
            <IconCode className="size-3.5" />
          )}
          <span className="sr-only sm:not-sr-only">{isPlan ? "Plan" : "Build"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
