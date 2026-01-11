"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { AgentKanbanBoard } from "@/lib/components/agent/AgentKanbanBoard";
import { NewFeatureButton } from "@/lib/components/features/NewFeatureButton";
import { useEffect, useState } from "react";

export default function RepoBoardPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repoName = params.repo as string;

  const repo = useQuery(api.githubRepos.getByOwnerAndName, {
    owner,
    name: repoName,
  });

  const boards = useQuery(
    api.boards.listByRepo,
    repo?._id ? { repoId: repo._id } : "skip"
  );

  const createBoard = useMutation(api.boards.create);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const board = boards && boards.length > 0 ? boards[0] : null;

  const boardData = useQuery(
    api.boards.getWithColumns,
    board?._id ? { id: board._id } : "skip"
  );

  useEffect(() => {
    if (repo === null) {
      router.replace("/repositories");
    }
  }, [repo, router]);

  useEffect(() => {
    async function createBoardForRepo() {
      if (repo && boards && boards.length === 0 && !isCreatingBoard) {
        setIsCreatingBoard(true);
        await createBoard({
          name: `${owner}/${repoName}`,
          repoId: repo._id,
        });
      }
    }
    createBoardForRepo();
  }, [repo, boards, isCreatingBoard, createBoard, owner, repoName]);

  if (repo === undefined || boards === undefined) {
    return (
      <>
        <PageHeader
          title="Loading..."
          showBack
          onBack={() => router.push("/repositories")}
        />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (repo === null) {
    return null;
  }

  if (!board || boardData === undefined) {
    return (
      <>
        <PageHeader
          title={`${owner}/${repoName}`}
          showBack
          onBack={() => router.push("/repositories")}
        />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (boardData === null) {
    return null;
  }

  const firstColumn = boardData.columns[0];

  return (
    <>
      <PageHeader
        title={`${owner}/${repoName}`}
        showBack
        onBack={() => router.push("/repositories")}
        headerRight={firstColumn && <NewFeatureButton columnId={firstColumn._id} />}
      />
      <Container>
        <AgentKanbanBoard columns={boardData.columns} />
      </Container>
    </>
  );
}
