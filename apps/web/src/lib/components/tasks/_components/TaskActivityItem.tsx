"use client";

import dayjs from "@conductor/shared/dates";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
  IconArrowRight,
  IconArrowsExchange,
  IconUser,
  IconFolder,
  IconFlag,
  IconTag,
  IconRobot,
  IconGitBranch,
  IconPencil,
  IconFileText,
} from "@tabler/icons-react";

type TaskActivityEvent = NonNullable<
  FunctionReturnType<typeof api.taskActivity.listByTask>
>[number];

type User = NonNullable<FunctionReturnType<typeof api.users.listAll>>[number];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  todo: "To Do",
  in_progress: "In Progress",
  code_review: "Code Review",
  business_review: "Business Review",
  done: "Done",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function getFieldIcon(field: TaskActivityEvent["field"]) {
  switch (field) {
    case "status":
      return <IconArrowsExchange size={14} />;
    case "assignee":
      return <IconUser size={14} />;
    case "project":
      return <IconFolder size={14} />;
    case "priority":
      return <IconFlag size={14} />;
    case "title":
      return <IconPencil size={14} />;
    case "description":
      return <IconFileText size={14} />;
    case "tags":
      return <IconTag size={14} />;
    case "model":
      return <IconRobot size={14} />;
    case "baseBranch":
      return <IconGitBranch size={14} />;
  }
}

function formatFieldLabel(field: TaskActivityEvent["field"]): string {
  switch (field) {
    case "status":
      return "status";
    case "assignee":
      return "assignee";
    case "project":
      return "project";
    case "priority":
      return "priority";
    case "title":
      return "title";
    case "description":
      return "description";
    case "tags":
      return "tags";
    case "model":
      return "model";
    case "baseBranch":
      return "base branch";
  }
}

function formatValue(
  field: TaskActivityEvent["field"],
  value: string | undefined,
  users: User[] | undefined,
): string {
  if (!value) return "none";
  switch (field) {
    case "status":
      return STATUS_LABELS[value] ?? value;
    case "priority":
      return PRIORITY_LABELS[value] ?? value;
    case "assignee": {
      const user = users?.find((u) => u._id === value);
      return user?.fullName?.trim() || "Unknown";
    }
    case "description":
      return value.length > 50 ? `${value.slice(0, 47)}...` : value;
    default:
      return value;
  }
}

function getUserName(
  userId: string | undefined,
  users: User[] | undefined,
): string {
  if (!userId) return "System";
  const user = users?.find((u) => u._id === userId);
  return user?.fullName?.trim() || "Someone";
}

export function TaskActivityItem({
  event,
  users,
}: {
  event: TaskActivityEvent;
  users: User[] | undefined;
}) {
  const actorName = getUserName(event.userId, users);
  const fieldLabel = formatFieldLabel(event.field);
  const oldFormatted = formatValue(event.field, event.oldValue, users);
  const newFormatted = formatValue(event.field, event.newValue, users);

  const showValues = event.field !== "description";

  return (
    <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/60">
        {getFieldIcon(event.field)}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-foreground">{actorName}</span>
        {" changed "}
        <span className="font-medium">{fieldLabel}</span>
        {showValues && (
          <>
            {" from "}
            <span className="font-medium text-foreground/80">
              {oldFormatted}
            </span>
            <IconArrowRight size={10} className="inline mx-0.5 align-middle" />
            <span className="font-medium text-foreground/80">
              {newFormatted}
            </span>
          </>
        )}
      </span>
      <span className="ml-auto shrink-0 text-muted-foreground/70">
        {dayjs(event.createdAt).fromNow()}
      </span>
    </div>
  );
}
