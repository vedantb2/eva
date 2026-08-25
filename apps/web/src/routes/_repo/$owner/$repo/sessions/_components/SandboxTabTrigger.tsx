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

/** A closable tab keeps its label on the mobile strip — the close target needs the width. */
export function isCollapsibleSandboxTab(tab: SandboxTabDescriptor): boolean {
  return tab.onClose === undefined && tab.closeBlockedReason === undefined;
}

/* The chip: `TabsTrigger` already supplies `rounded-lg`, `motion-press`,
   `relative z-1` and the active text colour, and the active *fill* is the
   `TabsList` sliding pill gliding underneath. Only the resting/hover tones and
   the tighter panel density belong here. */
const TAB_CLASS =
  "h-8 shrink-0 gap-1.5 px-2.5 text-xs data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-secondary data-[state=inactive]:hover:text-foreground md:w-8 md:justify-center md:px-0";

const CLOSE_CLASS =
  "motion-press max-sm:hit-target flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.96]";

const ICON_CLASS = "size-4 shrink-0";

function TabIcon({ icon }: { icon: SandboxTabIcon }) {
  if (icon.kind === "name") {
    return <TablerIconByName name={icon.name} className={ICON_CLASS} />;
  }
  const { Icon } = icon;
  return <Icon className={ICON_CLASS} />;
}

function TabCloseButton({
  tab,
  overlay,
}: {
  tab: SandboxTabDescriptor;
  overlay: boolean;
}) {
  const blockedReason = tab.closeBlockedReason;
  const closeClass = overlay
    ? cn(
        CLOSE_CLASS,
        "absolute -right-1 -top-1 size-4 rounded-full bg-card text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground",
      )
    : cn(CLOSE_CLASS, "-mr-1 ml-0.5");
  if (blockedReason !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={overlay ? "contents" : "inline-flex"}>
            <button
              type="button"
              disabled
              aria-label={blockedReason}
              className={cn(closeClass, "opacity-40")}
            >
              <IconX className="size-3" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side={overlay ? "left" : "bottom"} className="text-xs">
          {blockedReason}
        </TooltipContent>
      </Tooltip>
    );
  }
  const onClose = tab.onClose;
  if (onClose === undefined) return null;
  const closeLabel = `Close ${tab.label} tab`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={closeLabel}
          className={closeClass}
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
      </TooltipTrigger>
      <TooltipContent side={overlay ? "left" : "bottom"} className="text-xs">
        {closeLabel}
      </TooltipContent>
    </Tooltip>
  );
}

interface SandboxTabTriggerProps {
  tab: SandboxTabDescriptor;
  /** Icon-only, label moved into a tooltip — desktop rail, or a crowded mobile strip. */
  labelHidden?: boolean;
}

export function SandboxTabTrigger({
  tab,
  labelHidden = false,
}: SandboxTabTriggerProps) {
  const overlayClose = labelHidden;
  const trigger = (
    <TabsTrigger
      value={tab.value}
      aria-label={labelHidden ? tab.label : undefined}
      className={cn(TAB_CLASS, overlayClose && "group relative")}
    >
      <TabIcon icon={tab.icon} />
      {labelHidden ? null : tab.label}
      {tab.indicator ? (
        <span
          aria-label={tab.indicatorLabel}
          className={cn(
            "size-1.5 shrink-0 rounded-full bg-primary",
            overlayClose && "absolute right-0.5 top-0.5",
            tab.indicator === "activity" &&
              "animate-pulse ring-2 ring-primary/30",
          )}
        />
      ) : null}
      <TabCloseButton tab={tab} overlay={overlayClose} />
    </TabsTrigger>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Span keeps Tooltip `data-state` off the trigger — Radix Tabs also
            uses `data-state` for active/inactive. */}
        <span className="inline-flex">{trigger}</span>
      </TooltipTrigger>
      <TooltipContent
        side={labelHidden ? "left" : "bottom"}
        className="text-xs"
      >
        {tab.label}
      </TooltipContent>
    </Tooltip>
  );
}
