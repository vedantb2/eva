"use client";

import type { Id } from "@conductor/backend";
import type { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { GroupTasksModal } from "@/lib/components/quick-tasks/GroupTasksModal";
import { DeleteTasksModal } from "@/lib/components/quick-tasks/DeleteTasksModal";
import { AddLabelsModal } from "@/lib/components/quick-tasks/AddLabelsModal";
import { AssignTasksModal } from "@/lib/components/quick-tasks/AssignTasksModal";
import { ChangeStatusModal } from "@/lib/components/quick-tasks/ChangeStatusModal";
import { RunTasksModal } from "@/lib/components/quick-tasks/RunTasksModal";
import { ScheduleTasksModal } from "@/lib/components/quick-tasks/ScheduleTasksModal";
import type { BulkAction } from "./QuickTasksBulkBar";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksBulkModalsProps {
  activeBulkAction: BulkAction | null;
  onCloseBulkAction: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  selectedTasks: Task[];
  onSuccess: () => void;
}

export function QuickTasksBulkModals({
  activeBulkAction,
  onCloseBulkAction,
  selectedTaskIds,
  selectedTasks,
  onSuccess,
}: QuickTasksBulkModalsProps) {
  return (
    <>
      <GroupTasksModal
        isOpen={activeBulkAction === "group"}
        onClose={onCloseBulkAction}
        selectedTasks={selectedTasks}
        onSuccess={onSuccess}
      />
      <DeleteTasksModal
        isOpen={activeBulkAction === "delete"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
      />
      <AddLabelsModal
        isOpen={activeBulkAction === "addLabels"}
        onClose={onCloseBulkAction}
        selectedTasks={selectedTasks}
        onSuccess={onSuccess}
      />
      <AssignTasksModal
        isOpen={activeBulkAction === "assign"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
        mode="pick"
      />
      <AssignTasksModal
        isOpen={activeBulkAction === "assignMe"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
        mode="me"
      />
      <ChangeStatusModal
        isOpen={activeBulkAction === "changeStatus"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
      />
      <RunTasksModal
        isOpen={activeBulkAction === "run"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
      />
      <ScheduleTasksModal
        isOpen={activeBulkAction === "schedule"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
        onSuccess={onSuccess}
      />
    </>
  );
}
