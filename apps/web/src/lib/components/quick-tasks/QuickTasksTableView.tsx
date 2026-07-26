"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import type { SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { TableVirtuoso } from "react-virtuoso";
import { useQuickTaskFilters } from "@/routes/_repo/$owner/$repo/quick-tasks/_utils";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@eva/shared";
import { Badge, DataTableColumnHeader, type ColumnDef } from "@eva/ui";
import {
  statusConfig,
  statusWorkflowOrder,
  TASK_STATUSES,
} from "@/lib/components/tasks/TaskStatusBadge";
import { compactRelativeTime } from "@eva/shared/dates";
import { PriorityIcon } from "@/lib/components/priority/PriorityIcon";
import { entityPathSegment } from "@/lib/numId";
import { PRIORITY_LABELS } from "@/lib/components/priority/priorityMeta";
import { usePersistedScrollParent } from "@/lib/hooks/usePersistedScrollParent";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksTableViewProps {
  tasks: Task[];
  projectNames: Map<string, string>;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (task: Task) => void;
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
    // Sort down the pipeline (todo → … → done); the default string compare
    // would give alphabetical order, which reads as random to the user.
    sortingFn: (a, b) =>
      statusWorkflowOrder(a.original.status) -
      statusWorkflowOrder(b.original.status),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const level = row.original.priority;
      return (
        <span title={level ? PRIORITY_LABELS[level] : "No priority"}>
          <PriorityIcon level={level} size={14} />
        </span>
      );
    },
    enableSorting: false,
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
    cell: () => null,
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
  selectedIds: _selectedIds,
  onToggleSelect,
  onOpenTask,
}: QuickTasksTableViewProps) {
  "use no memo";
  const { basePath, owner, name } = useRepo();
  const users = useQuery(api.users.listAll);
  const { scrollParent, scrollRef } = usePersistedScrollParent(
    `${owner}/${name}/quick-tasks/table`,
  );
  // Default to workflow order so the table opens as a pipeline read: todo at
  // the top, done at the bottom. Clicking any header still overrides it.
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: false },
  ]);

  const [{ q, statuses }] = useQuickTaskFilters();
  const visibleStatuses = new Set(statuses);

  const tasks = (() => {
    const query = q.toLowerCase().trim();
    return externalTasks.filter((t) => {
      if (
        !TASK_STATUSES.some((s) => s === t.status && visibleStatuses.has(s))
      ) {
        return false;
      }
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    });
  })();

  const resolvedColumns = columns.map((col) => {
    if ("id" in col && col.id === "project") {
      return {
        ...col,
        cell: ({ row }: { row: { original: Task } }) => {
          const name = row.original.projectId
            ? projectNames.get(row.original.projectId)
            : undefined;
          if (!name) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-xs truncate max-w-[120px] block">{name}</span>
          );
        },
      };
    }
    if ("id" in col && col.id === "assignedTo") {
      return {
        ...col,
        cell: ({ row }: { row: { original: Task } }) => {
          const userId = row.original.assignedTo;
          if (!userId) return <span className="text-muted-foreground">—</span>;
          const user = users?.find((u) => u._id === userId);
          if (!user) return <span className="text-muted-foreground">—</span>;
          return <UserInitials user={user} size="sm" />;
        },
      };
    }
    return col;
  });

  const table = useReactTable({
    data: tasks,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
    },
    state: { sorting },
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto scrollbar">
        {scrollParent && (
          <TableVirtuoso
            customScrollParent={scrollParent}
            totalCount={rows.length}
            overscan={200}
            fixedHeaderContent={() =>
              headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))
            }
            itemContent={(index) => {
              const row = rows[index];
              return row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ));
            }}
            components={{
              Table: ({ style, ...props }) => (
                <table
                  className="w-full caption-bottom text-sm"
                  style={style}
                  {...props}
                />
              ),
              TableRow: ({ style, ...props }) => {
                const index = props["data-item-index"];
                const handleClick =
                  typeof index === "number"
                    ? (e: React.MouseEvent) => {
                        const task = rows[index].original;
                        const segment = entityPathSegment(task);
                        if (e.metaKey || e.ctrlKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (segment) {
                            window.open(
                              `${basePath}/quick-tasks/${segment}`,
                              "_blank",
                            );
                          }
                          return;
                        }
                        if (isSelecting) {
                          onToggleSelect(task._id);
                        } else {
                          onOpenTask(task);
                        }
                      }
                    : undefined;
                return (
                  <tr
                    className="border-b transition-colors hover:bg-muted/40 cursor-pointer data-[state=selected]:bg-muted"
                    style={style}
                    onClick={handleClick}
                    {...props}
                  />
                );
              },
              EmptyPlaceholder: () => (
                <tbody>
                  <tr>
                    <td
                      className="h-24 text-center text-muted-foreground"
                      colSpan={resolvedColumns.length}
                    >
                      No tasks match your filters.
                    </td>
                  </tr>
                </tbody>
              ),
            }}
          />
        )}
      </div>
    </div>
  );
}
