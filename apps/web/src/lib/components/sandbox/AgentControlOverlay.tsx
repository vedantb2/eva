import { Button } from "@eva/ui";

interface AgentControlOverlayProps {
  onTakeControl: () => void;
}

/**
 * Soft lock chrome while the agent drives the sandbox browser: invisible
 * catcher (click anywhere takes control) and a floating bottom bar with an
 * explicit CTA. No scrim — the view stays visible so the user can watch.
 */
export function AgentControlOverlay({ onTakeControl }: AgentControlOverlayProps) {
  return (
    <div className="absolute inset-0">
      <button
        type="button"
        onClick={onTakeControl}
        className="absolute inset-0 z-20 cursor-pointer hover:bg-background/5 motion-base"
        aria-label="Take control of the browser"
      />
      <div className="absolute bottom-3 left-1/2 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 items-center gap-2 duration-200">
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
          <span
            className="landing-pulse-dot size-1.5 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span className="truncate">Agent is in control</span>
        </div>
        <Button size="sm" type="button" onClick={onTakeControl}>
          Take control
        </Button>
      </div>
    </div>
  );
}
