import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
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

const actions: Array<{
  key: BulkAction;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  destructive?: boolean;
}> = [
  { key: "changeStatus", label: "Change Status", icon: IconRefresh },
  { key: "assign", label: "Assign to...", icon: IconUser },
  { key: "assignMe", label: "Assign to Me", icon: IconUserCheck },
  { key: "addLabels", label: "Add Labels", icon: IconTags },
  { key: "group", label: "Group into Project", icon: IconFolders },
  { key: "schedule", label: "Schedule Run", icon: IconCalendarClock },
  { key: "run", label: "Run Tasks", icon: IconPlayerPlay },
  { key: "delete", label: "Delete All", icon: IconTrash, destructive: true },
];

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
            <div className="flex items-center gap-1 rounded-xl bg-foreground px-2.5 py-2 shadow-lg">
              <div className="flex items-center px-2.5">
                <span className="text-sm font-medium text-background tabular-nums">
                  {selectedCount} selected
                </span>
              </div>

              <Separator
                orientation="vertical"
                className="mx-1.5 h-5 bg-background/20"
              />

              {actions.map((action) => (
                <span key={action.key} className="flex items-center">
                  {action.destructive && (
                    <Separator
                      orientation="vertical"
                      className="mx-1.5 h-5 bg-background/20"
                    />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-30 ${
                          action.destructive
                            ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            : "text-background/70 hover:bg-background/10 hover:text-background"
                        }`}
                        onClick={() => onSetBulkAction(action.key)}
                        disabled={!hasSelection}
                      >
                        <action.icon size={17} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-xs"
                      sideOffset={8}
                    >
                      {action.label}
                    </TooltipContent>
                  </Tooltip>
                </span>
              ))}

              <Separator
                orientation="vertical"
                className="mx-1.5 h-5 bg-background/20"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-background/70 transition-colors hover:bg-background/10 hover:text-background"
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
