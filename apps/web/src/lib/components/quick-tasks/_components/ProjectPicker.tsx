"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@eva/ui";
import { IconFolder, IconFolderPlus, IconCheck } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import type { api, Id } from "@eva/backend";

type Project = FunctionReturnType<typeof api.projects.list>[number];

export function ProjectPicker({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  open,
  setOpen,
  onCreateProject,
}: {
  projects: Project[] | undefined;
  selectedProjectId: Id<"projects"> | undefined;
  setSelectedProjectId: (id: Id<"projects"> | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreateProject: () => void;
}) {
  const selectedProject = selectedProjectId
    ? projects?.find((p) => p._id === selectedProjectId)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
        >
          <IconFolder className="size-3.5" />
          <span className={selectedProject ? "text-foreground" : ""}>
            {selectedProject ? selectedProject.title : "Project"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No projects found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no-project"
                onSelect={() => {
                  setSelectedProjectId(undefined);
                  setOpen(false);
                }}
              >
                No project
                {!selectedProjectId && (
                  <IconCheck className="size-3.5 ml-auto" />
                )}
              </CommandItem>
              {(projects ?? []).map((p) => (
                <CommandItem
                  key={p._id}
                  value={p.title}
                  onSelect={() => {
                    setSelectedProjectId(p._id);
                    setOpen(false);
                  }}
                >
                  <IconFolder className="size-3.5 text-muted-foreground" />
                  {p.title}
                  {selectedProjectId === p._id && (
                    <IconCheck className="size-3.5 ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="__new_project__"
                onSelect={() => {
                  setOpen(false);
                  onCreateProject();
                }}
              >
                <IconFolderPlus className="size-3.5 text-muted-foreground" />
                New project...
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
