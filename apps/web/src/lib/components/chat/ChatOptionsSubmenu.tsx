import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

/**
 * Presentational "Options" submenu for the composer "+" menu: Capture proof /
 * Run audit checkboxes. Stateless — the wrappers below bind it to a task or
 * project doc.
 */
function ChatOptionsSubmenuView({
  captureProof,
  runAudit,
  onToggleProof,
  onToggleAudit,
}: {
  captureProof: boolean;
  runAudit: boolean;
  onToggleProof: (next: boolean) => void;
  onToggleAudit: (next: boolean) => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconAdjustmentsHorizontal className="mr-2 size-4" />
        Options
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>Run options</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={captureProof}
          onCheckedChange={(checked) => onToggleProof(checked === true)}
          onSelect={(e) => e.preventDefault()}
        >
          Capture proof
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={runAudit}
          onCheckedChange={(checked) => onToggleAudit(checked === true)}
          onSelect={(e) => e.preventDefault()}
        >
          Run audit
        </DropdownMenuCheckboxItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Task sandbox-chat options, bound to the task doc with optimistic updates. */
export function TaskChatOptionsSubmenu({
  taskId,
}: {
  taskId: Id<"agentTasks">;
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
          ...(args.chatCaptureProofEnabled !== undefined
            ? { chatCaptureProofEnabled: args.chatCaptureProofEnabled }
            : {}),
          ...(args.chatRunAuditEnabled !== undefined
            ? { chatRunAuditEnabled: args.chatRunAuditEnabled }
            : {}),
        },
      );
    },
  );

  return (
    <ChatOptionsSubmenuView
      captureProof={task?.chatCaptureProofEnabled ?? false}
      runAudit={task?.chatRunAuditEnabled ?? false}
      onToggleProof={(next) =>
        updateTask({ id: taskId, chatCaptureProofEnabled: next })
      }
      onToggleAudit={(next) =>
        updateTask({ id: taskId, chatRunAuditEnabled: next })
      }
    />
  );
}

/** Project sandbox-chat options, bound to the project doc with optimistic updates. */
export function ProjectChatOptionsSubmenu({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const project = useQuery(api.projects.get, { id: projectId });
  const updateProject = useMutation(api.projects.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.projects.get, { id: projectId });
      if (current === undefined || current === null) return;
      localStore.setQuery(
        api.projects.get,
        { id: projectId },
        {
          ...current,
          ...(args.chatCaptureProofEnabled !== undefined
            ? { chatCaptureProofEnabled: args.chatCaptureProofEnabled }
            : {}),
          ...(args.chatRunAuditEnabled !== undefined
            ? { chatRunAuditEnabled: args.chatRunAuditEnabled }
            : {}),
        },
      );
    },
  );

  return (
    <ChatOptionsSubmenuView
      captureProof={project?.chatCaptureProofEnabled ?? false}
      runAudit={project?.chatRunAuditEnabled ?? false}
      onToggleProof={(next) =>
        updateProject({ id: projectId, chatCaptureProofEnabled: next })
      }
      onToggleAudit={(next) =>
        updateProject({ id: projectId, chatRunAuditEnabled: next })
      }
    />
  );
}
