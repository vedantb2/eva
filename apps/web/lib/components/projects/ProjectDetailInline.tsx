"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRouter } from "next/navigation";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Spinner,
} from "@conductor/ui";
import {
  IconExternalLink,
  IconUsers,
  IconCalendar,
  IconFlag,
  IconUser,
  IconCalendarEvent,
  IconCalendarDue,
  IconAlertTriangle,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { ProjectPhaseBadge } from "./ProjectPhaseBadge";
import { ProjectProgressBar } from "./ProjectProgressBar";

interface ProjectDetailInlineProps {
  projectId: Id<"projects">;
  projectUrl: string;
}

export function ProjectDetailInline({
  projectId,
  projectUrl,
}: ProjectDetailInlineProps) {
  const router = useRouter();
  const project = useQuery(api.projects.get, { id: projectId });
  const users = useQuery(api.users.listAll);
  const updateProject = useMutation(api.projects.update);

  const displayName = (user: NonNullable<typeof users>[number]) =>
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unnamed User";

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-y-auto scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-6 px-4">
        <div className="space-y-4">
          {(project.description || project.rawInput) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Description
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description || project.rawInput}
              </p>
            </div>
          )}
          <ProjectProgressBar projectId={projectId} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <IconCalendar size={12} />
              Created
            </p>
            <p className="text-sm text-foreground">
              {dayjs(project._creationTime).format("MMM D, YYYY")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayjs(project._creationTime).fromNow()}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <IconFlag size={12} />
              Phase
            </p>
            <ProjectPhaseBadge phase={project.phase} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <IconUser size={12} />
              Project Lead
            </p>
            <Select
              value={project.projectLead ?? "none"}
              onValueChange={(val) =>
                updateProject({
                  id: projectId,
                  projectLead:
                    val === "none" ? undefined : (val as Id<"users">),
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {(users ?? []).map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {displayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <IconUsers size={12} />
              Members
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                >
                  <IconUsers size={14} />
                  {project.members?.length
                    ? `${project.members.length} member${project.members.length > 1 ? "s" : ""}`
                    : "None"}
                </Button>
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
          </div>

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

          <DatePickerField
            label="Deadline"
            icon={IconAlertTriangle}
            value={project.deadline}
            className="text-destructive"
            onChange={(date) =>
              updateProject({
                id: projectId,
                deadline: date ?? undefined,
              })
            }
          />
        </div>

        <div>
          <Button onClick={() => router.push(projectUrl)}>
            <IconExternalLink size={16} />
            Open Project
          </Button>
        </div>
      </div>
    </div>
  );
}

function DatePickerField({
  label,
  value,
  className,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number | undefined;
  className?: string;
  icon?: typeof IconCalendar;
  onChange: (epoch: number | null) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <div>
      <p
        className={`text-xs mb-1.5 flex items-center gap-1.5 ${className ?? "text-muted-foreground"}`}
      >
        {Icon && <Icon size={12} />}
        {label}
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-start text-left font-normal ${!selected ? "text-muted-foreground" : ""}`}
          >
            <IconCalendar size={14} />
            {selected ? dayjs(selected).format("MMM D, YYYY") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? date.getTime() : null)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
