import type { ComponentType } from "react";
import { IconX } from "@tabler/icons-react";
import {
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@eva/ui";
import { TablerIconByName } from "@/lib/components/TablerIconByName";

/**
 * Why two kinds: a single `bg-primary` dot used to mean both "the agent is
 * driving Chrome right now" and "a plan landed, go read it". Those are
 * different asks — `activity` pulses because it is live and stops on its own,
 * `content` sits still because it waits for the user to act.
 */
export type SandboxTabIndicator = "activity" | "content";

/**
 * Builtin tabs import their icon statically; user-defined tabs store a free-text
 * Tabler name resolved lazily at render. A union keeps that difference explicit
 * instead of asking the builder to wrap the name in a fresh component per
 * render, which would remount the icon on every keystroke elsewhere in the tree.
 */
export type SandboxTabIcon =
  | { kind: "component"; Icon: ComponentType<{ className?: string }> }
  | { kind: "name"; name: string };

export interface SandboxTabDescriptor {
  /** Builtin tab id (`SandboxTab`) or a custom tab's name slug. */
  value: string;
  label: string;
  icon: SandboxTabIcon;
  indicator?: SandboxTabIndicator;
  /** Accessible name for the indicator dot. */
  indicatorLabel?: string;
  /** Set on the pinned closable tabs (Editor, Computer). */
  onClose?: () => void;
  /** Set instead of `onClose` to render close disabled with this explanation. */
  closeBlockedReason?: string;
}

/** A closable tab keeps its label — the close target needs the width. */
export function isCollapsibleSandboxTab(tab: SandboxTabDescriptor): boolean {
  return tab.onClose === undefined && tab.closeBlockedReason === undefined;
}

/* The chip: `TabsTrigger` already supplies `rounded-lg`, `motion-press`,
   `relative z-1` and the active text colour, and the active *fill* is the
   `TabsList` sliding pill gliding underneath. Only the resting/hover tones and
   the tighter panel density belong here. */
const TAB_CLASS =
  "h-7 shrink-0 gap-1.5 px-2.5 text-xs data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-secondary data-[state=inactive]:hover:text-foreground";

const CLOSE_CLASS =
  "motion-press max-sm:hit-target -mr-1 ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.96]";

const ICON_CLASS = "size-3.5 shrink-0";

function TabIcon({ icon }: { icon: SandboxTabIcon }) {
  if (icon.kind === "name") {
    return <TablerIconByName name={icon.name} className={ICON_CLASS} />;
  }
  const { Icon } = icon;
  return <Icon className={ICON_CLASS} />;
}

function TabCloseButton({ tab }: { tab: SandboxTabDescriptor }) {
  const blockedReason = tab.closeBlockedReason;
  if (blockedReason !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <button
              type="button"
              disabled
              aria-label={blockedReason}
              className={cn(CLOSE_CLASS, "opacity-40")}
            >
              <IconX className="size-3.5" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {blockedReason}
        </TooltipContent>
      </Tooltip>
    );
  }
  const onClose = tab.onClose;
  if (onClose === undefined) return null;
  return (
    <button
      type="button"
      aria-label={`Close ${tab.label} tab`}
      className={CLOSE_CLASS}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onPointerDown={(event) => {
        // Keep Radix Tabs from selecting the tab via the close hit-target.
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <IconX className="size-3.5" />
    </button>
  );
}

interface SandboxTabTriggerProps {
  tab: SandboxTabDescriptor;
  /** Icon-only, label moved into a tooltip — set when the strip is crowded. */
  labelHidden?: boolean;
}

export function SandboxTabTrigger({
  tab,
  labelHidden = false,
}: SandboxTabTriggerProps) {
  const trigger = (
    <TabsTrigger
      value={tab.value}
      aria-label={labelHidden ? tab.label : undefined}
      className={cn(TAB_CLASS, labelHidden && "w-7 justify-center px-0")}
    >
      <TabIcon icon={tab.icon} />
      {labelHidden ? null : tab.label}
      {tab.indicator ? (
        <span
          aria-label={tab.indicatorLabel}
          className={cn(
            "size-1.5 shrink-0 rounded-full bg-primary",
            tab.indicator === "activity" &&
              "animate-pulse ring-2 ring-primary/30",
          )}
        />
      ) : null}
      <TabCloseButton tab={tab} />
    </TabsTrigger>
  );
  if (!labelHidden) return trigger;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tab.label}
      </TooltipContent>
    </Tooltip>
  );
}
