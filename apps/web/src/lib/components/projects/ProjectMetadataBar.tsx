"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
} from "@conductor/ui";
import {
  IconUsers,
  IconCalendar,
  IconUser,
  IconCalendarEvent,
  IconCalendarDue,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { ProjectPhaseBadge } from "./ProjectPhaseBadge";

const GHOST_TRIGGER_CLASS =
  "h-8 w-auto border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-md text-[13px] [&>svg:last-child]:hidden shrink-0";

interface ProjectMetadataBarProps {
  projectId: Id<"projects">;
}

export function ProjectMetadataBar({ projectId }: ProjectMetadataBarProps) {
  const project = useQuery(api.projects.get, { id: projectId });
  const users = useQuery(api.users.listAll);
  const updateProject = useMutation(api.projects.update);

  const displayName = (user: NonNullable<typeof users>[number]) =>
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unnamed User";

  if (!project) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 sm:px-4 py-1 overflow-x-auto scrollbar-none">
      <div className="flex items-center h-8 px-2 shrink-0">
        <ProjectPhaseBadge phase={project.phase} />
      </div>
      <Select
        value={project.projectLead ?? "none"}
        onValueChange={(val) =>
          updateProject({
            id: projectId,
            projectLead: val === "none" ? undefined : (val as Id<"users">),
          })
        }
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${!project.projectLead ? "text-muted-foreground" : ""}`}
            >
              <IconUser size={14} className="text-muted-foreground" />
              <span>
                {project.projectLead
                  ? (() => {
                      const lead = (users ?? []).find(
                        (u) => u._id === project.projectLead,
                      );
                      return lead ? displayName(lead) : "Unknown";
                    })()
                  : "Project Lead"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Project Lead</SelectLabel>
            <SelectItem value="none">Unassigned</SelectItem>
            {(users ?? []).map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {displayName(user)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center h-8 rounded-md hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] shrink-0 ${!project.members?.length ? "text-muted-foreground" : ""}`}
          >
            <IconUsers size={14} className="text-muted-foreground shrink-0" />
            <span>
              {project.members?.length
                ? `${project.members.length} member${project.members.length > 1 ? "s" : ""}`
                : "Members"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(users ?? []).map((user) => {
            const isMember = project.members?.includes(user._id) ?? false;
            return (
              <DropdownMenuCheckboxItem
                key={user._id}
                checked={isMember}
                onCheckedChange={() => {
                  const current = project.members ?? [];
                  const next = isMember
                    ? current.filter((id) => id !== user._id)
                    : [...current, user._id];
                  updateProject({ id: projectId, members: next });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {displayName(user)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DatePickerField
        label="Start Date"
        icon={IconCalendarEvent}
        value={project.projectStartDate}
        onChange={(date) =>
          updateProject({
            id: projectId,
            projectStartDate: date ?? undefined,
          })
        }
      />

      <DatePickerField
        label="End Date"
        icon={IconCalendarDue}
        value={project.projectEndDate}
        onChange={(date) =>
          updateProject({
            id: projectId,
            projectEndDate: date ?? undefined,
          })
        }
      />
    </div>
  );
}

function DatePickerField({
  label,
  value,
  icon: Icon,
  iconClassName,
  onChange,
}: {
  label: string;
  value: number | undefined;
  icon: typeof IconCalendar;
  iconClassName?: string;
  onChange: (epoch: number | null) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center h-8 rounded-md hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] shrink-0 whitespace-nowrap ${!selected ? "text-muted-foreground" : ""}`}
        >
          <Icon
            size={14}
            className={iconClassName ?? "text-muted-foreground"}
          />
          <span>
            {selected ? dayjs(selected).format("MMM D, YYYY") : label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? date.getTime() : null)}
        />
      </PopoverContent>
    </Popover>
  );
}
