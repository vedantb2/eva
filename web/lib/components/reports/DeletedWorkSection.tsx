"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Chip } from "@heroui/react";
import { IconTrash, IconChecklist, IconTerminal2, IconLoader2 } from "@tabler/icons-react";
import dayjs from "@/lib/dates";

interface DeletedWorkSectionProps {
  tagId: string;
}

export function DeletedWorkSection({ tagId }: DeletedWorkSectionProps) {
  const { repo } = useRepo();

  const workItems = useQuery(api.reports.getWorkItemsByTag, {
    repoId: repo._id,
    tagId,
    includeDeleted: true,
  });

  if (workItems === undefined) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <IconLoader2 className="w-4 h-4 animate-spin" />
          Loading deleted items...
        </div>
      </div>
    );
  }

  const deletedTasks = workItems.tasks.filter((t) => t.deletedAt);
  const deletedSessions = workItems.sessions.filter((s) => s.deletedAt);

  if (deletedTasks.length === 0 && deletedSessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
        <IconTrash className="w-4 h-4 text-neutral-500" />
        Deleted / Removed Work
        <Chip size="sm" variant="flat" className="bg-neutral-100 dark:bg-neutral-800">
          {deletedTasks.length + deletedSessions.length}
        </Chip>
      </h3>

      <div className="space-y-4">
        {/* Deleted Tasks */}
        {deletedTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IconChecklist className="w-3.5 h-3.5" />
              Deleted Tasks ({deletedTasks.length})
            </h4>
            <div className="space-y-1.5">
              {deletedTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-400 dark:text-neutral-500 line-through truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusChip status={task.status} />
                    {task.deletedAt && (
                      <span className="text-xs text-neutral-400">
                        {dayjs(task.deletedAt).fromNow()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deleted Sessions */}
        {deletedSessions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IconTerminal2 className="w-3.5 h-3.5" />
              Deleted Sessions ({deletedSessions.length})
            </h4>
            <div className="space-y-1.5">
              {deletedSessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-400 dark:text-neutral-500 line-through truncate">
                      {session.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-neutral-400">
                      {session.messageCount} messages
                    </span>
                    {session.deletedAt && (
                      <span className="text-xs text-neutral-400">
                        {dayjs(session.deletedAt).fromNow()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    todo: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
    in_progress: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    business_review: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
    code_review: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    done: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  };

  const label = status.replace(/_/g, " ");

  return (
    <Chip size="sm" variant="flat" className={colorMap[status] || colorMap.todo}>
      {label}
    </Chip>
  );
}
