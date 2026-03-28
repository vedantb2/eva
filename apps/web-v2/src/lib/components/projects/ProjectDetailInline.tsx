"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
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
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { ProjectPhaseBadge } from "./ProjectPhaseBadge";
import { ProjectProgressBar } from "./ProjectProgressBar";

const GHOST_TRIGGER_CLASS =
  "h-10 border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-md text-[13px] [&>svg:last-child]:hidden";

interface ProjectDetailInlineProps {
  projectId: Id<"projects">;
  projectUrl: string;
}

export function ProjectDetailInline({
  projectId,
  projectUrl,
}: ProjectDetailInlineProps) {
  const navigate = useNavigate();
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
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-4">
            {(project.description || project.rawInput) && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description || project.rawInput}
              </p>
            )}
            <ProjectProgressBar projectId={projectId} />
          </div>

          <div className="pl-0 sm:pl-6 space-y-0.5">
            <div className="flex items-center min-h-[40px] rounded-md hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
              <IconCalendar
                size={14}
                className="text-muted-foreground shrink-0"
              />
              <span>{dayjs(project._creationTime).format("MMM D, YYYY")}</span>
              <span className="text-muted-foreground">
                ({dayjs(project._creationTime).fromNow()})
              </span>
            </div>

            <div className="flex items-center min-h-[40px] rounded-md hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
              <IconFlag size={14} className="text-muted-foreground shrink-0" />
              <ProjectPhaseBadge phase={project.phase} />
            </div>

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
                  className={`flex items-center w-full min-h-[40px] rounded-md hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] ${!project.members?.length ? "text-muted-foreground" : ""}`}
                >
                  <IconUsers
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
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
        </div>

        <div>
          <Button onClick={() => navigate({ to: projectUrl })}>
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
          className={`flex items-center w-full min-h-[40px] rounded-md hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] ${!selected ? "text-muted-foreground" : ""}`}
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
