"use client";

import type { Id } from "@conductor/backend";
import type { api } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { GroupTasksModal } from "@/lib/components/issues/GroupTasksModal";
import { DeleteTasksModal } from "@/lib/components/issues/DeleteTasksModal";
import { AddLabelsModal } from "@/lib/components/issues/AddLabelsModal";
import { AssignTasksModal } from "@/lib/components/issues/AssignTasksModal";
import { ChangeStatusModal } from "@/lib/components/issues/ChangeStatusModal";
import { RunTasksModal } from "@/lib/components/issues/RunTasksModal";
import { ScheduleTasksModal } from "@/lib/components/issues/ScheduleTasksModal";
import type { BulkAction } from "./IssuesBulkBar";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface IssuesBulkModalsProps {
  activeBulkAction: BulkAction | null;
  onCloseBulkAction: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  selectedTasks: Task[];
  onSuccess: () => void;
}

export function IssuesBulkModals({
  activeBulkAction,
  onCloseBulkAction,
  selectedTaskIds,
  selectedTasks,
  onSuccess,
}: IssuesBulkModalsProps) {
  return (
    <>
      <GroupTasksModal
        isOpen={activeBulkAction === "group"}
        onClose={onCloseBulkAction}
        selectedTaskIds={selectedTaskIds}
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
