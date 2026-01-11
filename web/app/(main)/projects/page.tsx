"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@/lib/components/ui/Button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { ProjectCard } from "@/lib/components/ProjectCard";
import { CreateProjectModal } from "@/lib/components/CreateProjectModal";
import { ConfirmationModal } from "@/lib/components/modals/ConfirmationModal";
import { IconFolder, IconPlus } from "@tabler/icons-react";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list);
  const removeProject = useMutation(api.projects.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"projects"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await removeProject({ id: deleteId });
    setIsDeleting(false);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        headerRight={
          <Button onClick={() => setIsCreateOpen(true)}>
            <IconPlus size={16} className="mr-1" />
            New Project
          </Button>
        }
      />
      <Container>
        {projects === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={IconFolder}
            title="No projects yet"
            description="Create your first project to get started"
            actionLabel="Create Project"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onDelete={() => setDeleteId(project._id)}
              />
            ))}
          </div>
        )}
      </Container>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? All tasks will be permanently removed."
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
