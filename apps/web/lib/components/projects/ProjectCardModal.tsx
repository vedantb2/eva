"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@conductor/ui";
import { IconExternalLink, IconUsers, IconCalendar } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { ProjectPhaseBadge } from "./ProjectPhaseBadge";
import { ProjectProgressBar } from "./ProjectProgressBar";

interface ProjectCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  projectUrl: string;
}

export function ProjectCardModal({
  isOpen,
  onClose,
  projectId,
  projectUrl,
}: ProjectCardModalProps) {
  const router = useRouter();
  const project = useQuery(api.projects.get, { id: projectId });
  const users = useQuery(api.users.listAll);
  const updateProject = useMutation(api.projects.update);

  if (!project) return null;

  const displayName = (user: NonNullable<typeof users>[number]) =>
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unnamed User";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_200px] gap-6 min-h-[200px]">
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

          <div className="pl-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Phase</p>
              <ProjectPhaseBadge phase={project.phase} />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
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
              <p className="text-xs text-muted-foreground mb-1.5">Members</p>
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
                    const isMember =
                      project.members?.includes(user._id) ?? false;
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
        <DialogFooter>
          <Button
            onClick={() => {
              onClose();
              router.push(projectUrl);
            }}
          >
            <IconExternalLink size={16} />
            View Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (epoch: number | null) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
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
