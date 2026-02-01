"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import {
  IconLayoutKanban,
  IconPlus,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconSearch,
  IconNotes,
  IconCheck,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";
import {
  KanbanColumn,
  ColumnConfig,
} from "@/lib/components/kanban/KanbanColumn";
import { Input } from "@heroui/input";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { ProjectCard } from "@/lib/components/projects/ProjectCard";

type ProjectPhase = "draft" | "finalized" | "active" | "completed";
type SortField = "created" | "title";
type SortDirection = "asc" | "desc";

const ALL_PHASES: ProjectPhase[] = [
  "draft",
  "finalized",
  "active",
  "completed",
];

const phaseConfig: Record<ProjectPhase, ColumnConfig & { cardBg: string }> = {
  draft: {
    label: "Draft",
    bg: "bg-neutral-200 dark:bg-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
    cardBg: "bg-white dark:bg-neutral-900",
    icon: IconNotes,
  },
  finalized: {
    label: "Finalized",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-400",
    cardBg: "bg-white dark:bg-neutral-900",
    icon: IconCheck,
  },
  active: {
    label: "Active",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    cardBg: "bg-white dark:bg-neutral-900",
    icon: IconClock,
  },
  completed: {
    label: "Completed",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    cardBg: "bg-white dark:bg-neutral-900",
    icon: IconCircleCheck,
  },
};

export function ProjectsClient() {
  const { repo, fullName } = useRepo();
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const deleteProject = useMutation(api.projects.deleteCascade);
  const [isCreating, setIsCreating] = useState(false);
  const [visiblePhases, setVisiblePhases] = useState<Set<ProjectPhase>>(
    new Set(ALL_PHASES),
  );
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [projectToDelete, setProjectToDelete] = useState<{
    id: Id<"projects">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const projectsByPhase = useMemo(() => {
    if (!projects) return {} as Record<ProjectPhase, typeof projects>;
    const query = searchQuery.toLowerCase().trim();
    const grouped = ALL_PHASES.reduce(
      (acc, phase) => {
        acc[phase] = projects
          .filter((p) => p.phase === phase)
          .filter((p) => {
            if (!query) return true;
            return (
              p.title.toLowerCase().includes(query) ||
              p.rawInput?.toLowerCase().includes(query) ||
              p.description?.toLowerCase().includes(query)
            );
          })
          .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
              case "created":
                comparison = a._creationTime - b._creationTime;
                break;
              case "title":
                comparison = a.title.localeCompare(b.title);
                break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
          });
        return acc;
      },
      {} as Record<ProjectPhase, typeof projects>,
    );
    return grouped;
  }, [projects, sortField, sortDirection, searchQuery]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject({ id: projectToDelete.id });
      setProjectToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhaseToggle = (keys: Set<string>) => {
    const newPhases = new Set(Array.from(keys) as ProjectPhase[]);
    if (newPhases.size === 0) return;
    setVisiblePhases(newPhases);
  };

  return (
    <>
      <PageWrapper
        title="Projects"
        fillHeight
        headerRight={
          <Button
            color="primary"
            size="sm"
            startContent={<IconPlus size={16} />}
            onPress={() => setIsCreating(true)}
          >
            New Project
          </Button>
        }
      >
        {projects === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={IconLayoutKanban}
            title="No projects yet"
            description="Create a project to describe a feature and let AI help you break it down into tasks"
            actionLabel="Create Project"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={<IconFilter size={16} />}
                    >
                      {visiblePhases.size === ALL_PHASES.length
                        ? "All Columns"
                        : `${visiblePhases.size} Columns`}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Toggle columns"
                    selectionMode="multiple"
                    selectedKeys={visiblePhases}
                    onSelectionChange={(keys) =>
                      handlePhaseToggle(keys as Set<string>)
                    }
                    closeOnSelect={false}
                  >
                    <DropdownItem key="draft">Draft</DropdownItem>
                    <DropdownItem key="finalized">Finalized</DropdownItem>
                    <DropdownItem key="active">Active</DropdownItem>
                    <DropdownItem key="completed">Completed</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={
                        sortDirection === "asc" ? (
                          <IconSortAscending size={16} />
                        ) : (
                          <IconSortDescending size={16} />
                        )
                      }
                    >
                      {sortField === "created" ? "Date" : "Title"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort by"
                    selectionMode="single"
                    selectedKeys={new Set([sortField])}
                    onSelectionChange={(keys) =>
                      setSortField(Array.from(keys)[0] as SortField)
                    }
                  >
                    <DropdownItem key="created">Date Created</DropdownItem>
                    <DropdownItem key="title">Title</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Button
                  variant="flat"
                  size="sm"
                  isIconOnly
                  onPress={() =>
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortDirection === "asc" ? (
                    <IconSortAscending size={16} />
                  ) : (
                    <IconSortDescending size={16} />
                  )}
                </Button>
              </div>
              <Input
                placeholder="Search projects..."
                size="sm"
                className="w-1/2 mx-auto"
                startContent={
                  <IconSearch size={16} className="text-default-400" />
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>
            <div className="flex items-stretch gap-2 overflow-x-auto scrollbar flex-1 min-h-0">
              {ALL_PHASES.filter((phase) => visiblePhases.has(phase)).map(
                (phase) => (
                  <KanbanColumn
                    key={phase}
                    id={phase}
                    config={phaseConfig[phase]}
                    count={projectsByPhase[phase]?.length ?? 0}
                    droppable={false}
                  >
                    {projectsByPhase[phase]?.map((project) => (
                      <ProjectCard
                        key={project._id}
                        projectId={project._id}
                        userId={project.userId}
                        title={project.title}
                        description={project.description}
                        rawInput={project.rawInput}
                        branchName={project.branchName}
                        repoFullName={fullName}
                        createdAt={project._creationTime}
                        projectUrl={`/${encodeRepoSlug(fullName)}/projects/${project._id}`}
                        cardBg={phaseConfig[phase].cardBg}
                        onDelete={() =>
                          setProjectToDelete({
                            id: project._id,
                            title: project.title,
                          })
                        }
                      />
                    ))}
                    {(projectsByPhase[phase]?.length ?? 0) === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-4">
                        No projects
                      </p>
                    )}
                  </KanbanColumn>
                ),
              )}
            </div>
          </div>
        )}
      </PageWrapper>
      <NewProjectModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
      >
        <ModalContent>
          <ModalHeader>Delete Project</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete{" "}
              <strong>{projectToDelete?.title}</strong>?
            </p>
            <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <p className="text-sm text-warning-700 dark:text-warning-300">
                This will permanently delete the project and all associated
                tasks, subtasks, agent runs, and dependencies.
              </p>
            </div>
            <p className="text-sm text-default-500 mt-3">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
