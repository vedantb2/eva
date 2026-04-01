"use client";

import { useMemo, useState } from "react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { SortingState } from "@tanstack/react-table";
import {
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full">
      <div className="flex-1 min-h-0 overflow-auto scrollbar">
        <DataTableProvider
          columns={columns}
          data={projects}
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
                emptyMessage="No projects match your filters."
              >
                {({ row }) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    onClick={() => onOpenProject(row.original._id)}
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
