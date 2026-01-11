"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { useEffect } from "react";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as Id<"projects">;

  const project = useQuery(api.projects.get, { id: projectId });
  const tasks = useQuery(api.tasks.listByProject, { projectId });

  useEffect(() => {
    if (project === null) {
      router.replace("/projects");
    }
  }, [project, router]);

  if (project === undefined || tasks === undefined) {
    return (
      <>
        <PageHeader title="Loading..." showBack onBack={() => router.push("/projects")} />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (project === null) {
    return null;
  }

  return (
    <>
      <PageHeader title={project.name} showBack onBack={() => router.push("/projects")} />
      <Container>
        <KanbanBoard projectId={projectId} tasks={tasks} />
      </Container>
    </>
  );
}
