"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { TableVirtuoso } from "react-virtuoso";
import { DataTableColumnHeader, type ColumnDef } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import { IconGitBranch } from "@tabler/icons-react";
import {
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { compactRelativeTime } from "@conductor/shared/dates";

type Project = FunctionReturnType<typeof api.projects.list>[number];

function PhaseCell({ phase }: { phase: ProjectPhase }) {
  const cfg = phaseConfig[phase];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={cfg.text} />
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

const columns: ColumnDef<Project, unknown>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium truncate max-w-[250px] block">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: "phase",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phase" />
    ),
    cell: ({ row }) => <PhaseCell phase={row.original.phase} />,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.original.description ?? row.original.rawInput;
      if (!desc) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {desc}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    id: "lead",
    header: "Lead",
    cell: ({ row }) => {
      const leadId = row.original.projectLead;
      if (!leadId) return <span className="text-muted-foreground">—</span>;
      return <UserInitials userId={leadId} size="sm" />;
    },
    enableSorting: false,
  },
  {
    id: "members",
    header: "Members",
    cell: ({ row }) => {
      const memberIds = row.original.members;
      if (!memberIds || memberIds.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex items-center -space-x-1">
          {memberIds.slice(0, 3).map((id) => (
            <UserInitials key={id} userId={id} size="sm" />
          ))}
          {memberIds.length > 3 && (
            <span className="text-[10px] text-muted-foreground ml-1.5">
              +{memberIds.length - 3}
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "branchName",
    header: "Branch",
    cell: ({ row }) => {
      const branch = row.original.branchName;
      if (!branch) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconGitBranch size={12} />
          <span className="truncate max-w-[120px]">{branch}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "created",
    accessorFn: (row) => row._creationTime,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {compactRelativeTime(row.original._creationTime)}
      </span>
    ),
  },
];

interface ProjectsTableViewProps {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDelete: (id: Id<"projects">, title: string) => void;
}

export function ProjectsTableView({
  projects,
  onOpenProject,
}: ProjectsTableViewProps) {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    setScrollParent(node);
  }, []);

  const table = useReactTable({
    data: projects,
    columns,
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
    <div className="flex flex-1 min-h-0 flex-col w-full">
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
                    ? () => onOpenProject(rows[index].original._id)
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
                      colSpan={columns.length}
                    >
                      No projects match your filters.
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
