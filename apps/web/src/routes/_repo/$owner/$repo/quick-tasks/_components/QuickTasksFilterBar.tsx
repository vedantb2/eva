import { Button } from "@conductor/ui";
import { IconFolder, IconFolderOff } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Project = FunctionReturnType<typeof api.projects.list>[number];

interface QuickTasksFilterBarProps {
  projects: Project[] | undefined;
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
}

export function QuickTasksFilterBar({
  projects,
  projectFilter,
  onProjectFilterChange,
}: QuickTasksFilterBarProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
      <FilterChip
        label="All"
        active={projectFilter === "all"}
        onClick={() => onProjectFilterChange("all")}
      />
      <FilterChip
        label="No Project"
        icon={<IconFolderOff size={14} />}
        active={projectFilter === "none"}
        onClick={() => onProjectFilterChange("none")}
      />
      {projects.map((p) => (
        <FilterChip
          key={p._id}
          label={p.title}
          icon={<IconFolder size={14} />}
          active={projectFilter === p._id}
          onClick={() => onProjectFilterChange(p._id)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "secondary" : "ghost"}
      className="motion-press h-7 shrink-0 gap-1 rounded-full px-3 text-xs hover:scale-[1.01] active:scale-[0.99]"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
