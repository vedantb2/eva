"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { IconGitBranch, IconGitPullRequest, IconDotsVertical } from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

export type TaskStatus = "todo" | "in_progress" | "business_review" | "code_review" | "done";

export const statusCardBg: Record<TaskStatus, string> = {
  todo: "bg-neutral-200/40 dark:bg-neutral-800",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  business_review: "bg-orange-50 dark:bg-orange-900/20",
  code_review: "bg-purple-100/60 dark:bg-purple-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
};

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  createdBy?: Id<"users">;
  branchName?: string;
  onClick?: () => void;
}

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  createdAt,
  createdBy,
  branchName,
  onClick,
}: QuickTaskCardProps) {
  const { fullName } = useRepo();
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const hasError = runs?.[0]?.status === "error";

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      shadow="none"
      radius="sm"
      className={`w-full shadow ${statusCardBg[status]} ${hasError ? "border-2 border-danger-500" : ""}`}
    >
      <CardBody className="p-3 gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SubtaskProgress taskId={id} />
            {(branchName || latestPrUrl) && (
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown>
                  <DropdownTrigger>
                    <button type="button" className="p-1 rounded hover:bg-default-200 transition-colors">
                      <IconDotsVertical size={14} className="text-default-400" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Task actions">
                    {branchName ? (
                      <DropdownItem
                        key="branch"
                        startContent={<IconGitBranch size={16} />}
                        onPress={() => window.open(`https://github.com/${fullName}/tree/${branchName}`, "_blank")}
                      >
                        View Branch
                      </DropdownItem>
                    ) : null}
                    {latestPrUrl ? (
                      <DropdownItem
                        key="pr"
                        startContent={<IconGitPullRequest size={16} />}
                        onPress={() => window.open(latestPrUrl, "_blank")}
                      >
                        View PR
                      </DropdownItem>
                    ) : null}
                  </DropdownMenu>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          {createdBy && <UserInitials userId={createdBy} />}
          <span className="text-xs text-default-400 ml-auto">{dayjs(createdAt).fromNow()}</span>
        </div>
      </CardBody>
    </Card>
  );
}
