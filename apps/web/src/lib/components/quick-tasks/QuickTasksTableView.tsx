"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { SortingState } from "@tanstack/react-table";
import { useQueryStates } from "nuqs";
import { searchParser, statusesParser } from "@/lib/search-params";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Badge,
  DataTableProvider,
  DataTableHeader,
  DataTableHeaderGroup,
  DataTableHead,
  DataTableColumnHeader,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  type ColumnDef,
} from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import {
  statusConfig,
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { compactRelativeTime } from "@conductor/shared/dates";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksTableViewProps {
  tasks: Task[];
  projectNames: Map<string, string>;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
}

function StatusCell({ status }: { status: Task["status"] }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={cfg.text} />
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

const columns: ColumnDef<Task, unknown>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium truncate max-w-[300px] block">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusCell status={row.original.status} />,
  },
  {
    id: "project",
    header: "Project",
    cell: () => null,
    enableSorting: false,
  },
  {
    id: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags;
      if (!tags || tags.length === 0) return null;
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{tags.length - 2}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "assignedTo",
    header: "Assigned",
    cell: ({ row }) => {
      const userId = row.original.assignedTo;
      if (!userId) return <span className="text-muted-foreground">—</span>;
      return <UserInitials userId={userId} size="sm" />;
    },
    enableSorting: false,
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => {
      const model = row.original.model;
      if (!model) return null;
      return (
        <span className="text-xs text-muted-foreground truncate max-w-[100px] block">
          {model}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {compactRelativeTime(row.original.createdAt)}
      </span>
    ),
  },
];

export function QuickTasksTableView({
  tasks: externalTasks,
  projectNames,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
}: QuickTasksTableViewProps) {
  const { repoId } = useRepo();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [{ q, statuses }] = useQueryStates({
    q: searchParser,
    statuses: statusesParser,
  });
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);

  const tasks = useMemo(() => {
    const query = q.toLowerCase().trim();
    return externalTasks
      .filter((t) =>
        TASK_STATUSES.some((s) => s === t.status && visibleStatuses.has(s)),
      )
      .filter((t) => {
        if (!query) return true;
        return (
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
        );
      });
  }, [externalTasks, q, visibleStatuses]);

  const columnsWithProject = useMemo(() => {
    return columns.map((col) => {
      if ("id" in col && col.id === "project") {
        return {
          ...col,
          cell: ({ row }: { row: { original: Task } }) => {
            const name = row.original.projectId
              ? projectNames.get(row.original.projectId)
              : undefined;
            if (!name) return <span className="text-muted-foreground">—</span>;
            return (
              <span className="text-xs truncate max-w-[120px] block">
                {name}
              </span>
            );
          },
        };
      }
      return col;
    });
  }, [projectNames]);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-auto scrollbar">
        <DataTableProvider
          columns={columnsWithProject}
          data={tasks}
          sorting={sorting}
          onSortingChange={setSorting}
        >
          {({ headerGroups, rows, columnCount }) => (
            <>
              <DataTableHeader headerGroups={headerGroups}>
                {({ headerGroup }) => (
                  <DataTableHeaderGroup
                    key={headerGroup.id}
                    headerGroup={headerGroup}
                  >
                    {({ header }) => (
                      <DataTableHead key={header.id} header={header} />
                    )}
                  </DataTableHeaderGroup>
                )}
              </DataTableHeader>
              <DataTableBody
                rows={rows}
                columnCount={columnCount}
                emptyMessage="No tasks match your filters."
              >
                {({ row }) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    onClick={() => {
                      const task = row.original;
                      if (isSelecting) {
                        onToggleSelect(task._id);
                      } else {
                        onOpenTask(task._id);
                      }
                    }}
                    className="hover:bg-muted/40"
                  >
                    {({ cell }) => <DataTableCell key={cell.id} cell={cell} />}
                  </DataTableRow>
                )}
              </DataTableBody>
            </>
          )}
        </DataTableProvider>
      </div>
    </div>
  );
}
