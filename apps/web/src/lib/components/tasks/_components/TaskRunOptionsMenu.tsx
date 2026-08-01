import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  Badge,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@eva/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";

/**
 * Proof/audit default for a task's runs, attached to the Run button. Edits the
 * persisted task setting (drives runs started from a plain Run button); the
 * request-changes composer overrides it per-run. Bound to Convex with an
 * optimistic update — no local mirror.
 */
export function TaskRunOptionsMenu({
  taskId,
  size,
}: {
  taskId: Id<"agentTasks">;
  size: "default" | "sm";
}) {
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const updateTask = useMutation(api.agentTasks.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.agentTasks.get, { id: taskId });
      if (!current) return;
      localStore.setQuery(
        api.agentTasks.get,
        { id: taskId },
        {
          ...current,
          ...(args.screenshotsVideosEnabled !== undefined
            ? {
                screenshotsVideosEnabled:
                  args.screenshotsVideosEnabled ?? undefined,
              }
            : {}),
          ...(args.runAuditEnabled !== undefined
            ? { runAuditEnabled: args.runAuditEnabled ?? undefined }
            : {}),
        },
      );
    },
  );

  const captureProof = task?.screenshotsVideosEnabled === true;
  const runAudit = task?.runAuditEnabled === true;
  const checkedCount = (captureProof ? 1 : 0) + (runAudit ? 1 : 0);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size={size === "sm" ? "icon-sm" : "icon"}
              className="relative"
              aria-label={
                checkedCount > 0
                  ? `Run options, ${checkedCount} enabled`
                  : "Run options"
              }
            >
              <IconAdjustmentsHorizontal size={size === "sm" ? 16 : 18} />
              {checkedCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-3xs leading-none">
                  {checkedCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Run options</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Steps on run</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={captureProof}
          onCheckedChange={(checked) =>
            updateTask({
              id: taskId,
              screenshotsVideosEnabled: checked === true,
            })
          }
          onSelect={(e) => e.preventDefault()}
        >
          Capture proof
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={runAudit}
          onCheckedChange={(checked) =>
            updateTask({ id: taskId, runAuditEnabled: checked === true })
          }
          onSelect={(e) => e.preventDefault()}
        >
          Run audit
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
