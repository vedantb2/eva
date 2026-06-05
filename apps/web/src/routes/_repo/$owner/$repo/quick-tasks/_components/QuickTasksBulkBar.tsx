import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import {
  IconFolders,
  IconTrash,
  IconTags,
  IconUser,
  IconUserCheck,
  IconRefresh,
  IconPlayerPlay,
  IconCalendarClock,
  IconDots,
  IconX,
} from "@tabler/icons-react";

export type BulkAction =
  | "actions"
  | "group"
  | "delete"
  | "addLabels"
  | "assign"
  | "assignMe"
  | "changeStatus"
  | "run"
  | "schedule";

interface QuickTasksBulkBarProps {
  isSelecting: boolean;
  selectedCount: number;
  onExitSelect: () => void;
  activeBulkAction: BulkAction | null;
  onSetBulkAction: (action: BulkAction | null) => void;
}

interface ActionDef {
  key: BulkAction;
  /** Full label used in the More menu and for accessibility. */
  label: string;
  /** Shorter label shown inline in the bar (defaults to `label`). */
  shortLabel?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  destructive?: boolean;
}

/** Actions shown directly in the bar with responsive labels. */
const primaryActions: ActionDef[] = [
  {
    key: "changeStatus",
    label: "Change Status",
    shortLabel: "Status",
    icon: IconRefresh,
  },
  {
    key: "assign",
    label: "Assign to...",
    shortLabel: "Assign",
    icon: IconUser,
  },
  { key: "run", label: "Run Tasks", shortLabel: "Run", icon: IconPlayerPlay },
];

/** Secondary actions tucked into the "More" dropdown to keep the bar compact. */
const moreActions: ActionDef[] = [
  { key: "assignMe", label: "Assign to Me", icon: IconUserCheck },
  { key: "addLabels", label: "Add Labels", icon: IconTags },
  { key: "group", label: "Group into Project", icon: IconFolders },
  { key: "schedule", label: "Schedule Run", icon: IconCalendarClock },
];

const deleteAction: ActionDef = {
  key: "delete",
  label: "Delete All",
  shortLabel: "Delete",
  icon: IconTrash,
  destructive: true,
};

/**
 * A single labelled button inside the action bar. The label collapses to
 * icon-only below the `sm` breakpoint (HeroUI "responsive labels" pattern).
 */
function BarButton({
  action,
  disabled,
  onClick,
}: {
  action: ActionDef;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      aria-label={action.label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        action.destructive
          ? "text-destructive hover:bg-destructive/20 hover:text-destructive"
          : "text-background/80 hover:bg-background/10 hover:text-background"
      }`}
    >
      <Icon size={17} />
      <span className="hidden sm:inline">
        {action.shortLabel ?? action.label}
      </span>
    </button>
  );
}

export function QuickTasksBulkBar({
  isSelecting,
  selectedCount,
  onExitSelect,
  activeBulkAction: _activeBulkAction,
  onSetBulkAction,
}: QuickTasksBulkBarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <AnimatePresence initial={false}>
      {isSelecting && (
        <motion.div
          key="quick-tasks-bulk-bar"
          className="absolute inset-x-0 bottom-3 z-20 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <TooltipProvider delayDuration={300}>
            <div className="flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-xl bg-foreground px-2.5 py-2 shadow-lg scrollbar-none">
              {/* Prefix: selection count */}
              <div className="flex shrink-0 items-center gap-2 pl-1 pr-0.5">
                <span className="rounded-md bg-background/15 px-2 py-0.5 text-xs font-semibold text-background tabular-nums">
                  {selectedCount}
                </span>
                <span className="hidden text-sm font-medium text-background/70 sm:inline">
                  selected
                </span>
              </div>

              <Separator
                orientation="vertical"
                className="mx-1.5 h-5 shrink-0 bg-background/20"
              />

              {/* Content: primary actions + More dropdown */}
              {primaryActions.map((action) => (
                <BarButton
                  key={action.key}
                  action={action}
                  disabled={!hasSelection}
                  onClick={() => onSetBulkAction(action.key)}
                />
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More actions"
                    disabled={!hasSelection}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-background/80 transition-colors hover:bg-background/10 hover:text-background disabled:pointer-events-none disabled:opacity-30 data-[state=open]:bg-background/10 data-[state=open]:text-background"
                  >
                    <IconDots size={17} />
                    <span className="hidden sm:inline">More</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" sideOffset={8}>
                  {moreActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={action.key}
                        disabled={!hasSelection}
                        onClick={() => onSetBulkAction(action.key)}
                      >
                        <Icon size={16} />
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator
                orientation="vertical"
                className="mx-1.5 h-5 shrink-0 bg-background/20"
              />

              <BarButton
                action={deleteAction}
                disabled={!hasSelection}
                onClick={() => onSetBulkAction(deleteAction.key)}
              />

              <Separator
                orientation="vertical"
                className="mx-1.5 h-5 shrink-0 bg-background/20"
              />

              {/* Suffix: dismiss selection */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Cancel selection"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-background/70 transition-colors hover:bg-background/10 hover:text-background"
                    onClick={onExitSelect}
                  >
                    <IconX size={17} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs" sideOffset={8}>
                  Cancel selection
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
