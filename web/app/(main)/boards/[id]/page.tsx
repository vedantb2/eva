"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { AgentKanbanBoard } from "@/lib/components/agent/AgentKanbanBoard";
import { useEffect } from "react";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as Id<"boards">;

  const data = useQuery(api.boards.getWithColumns, { id: boardId });

  useEffect(() => {
    if (data === null) {
      router.replace("/boards");
    }
  }, [data, router]);

  if (data === undefined) {
    return (
      <>
        <PageHeader title="Loading..." showBack onBack={() => router.push("/boards")} />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (data === null) {
    return null;
  }

  return (
    <>
      <PageHeader title={data.board.name} showBack onBack={() => router.push("/boards")} />
      <Container>
        <AgentKanbanBoard columns={data.columns} />
      </Container>
    </>
  );
}
