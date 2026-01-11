"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@/lib/components/ui/Button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { BoardCard } from "@/lib/components/boards/BoardCard";
import { CreateBoardModal } from "@/lib/components/boards/CreateBoardModal";
import { ConfirmationModal } from "@/lib/components/modals/ConfirmationModal";
import { IconLayoutKanban, IconPlus } from "@tabler/icons-react";

export default function BoardsPage() {
  const boards = useQuery(api.boards.list);
  const removeBoard = useMutation(api.boards.remove);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"boards"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await removeBoard({ id: deleteId });
    setIsDeleting(false);
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title="Boards"
        headerRight={
          <Button onClick={() => setIsCreateOpen(true)}>
            <IconPlus size={16} className="mr-1" />
            New Board
          </Button>
        }
      />
      <Container>
        {boards === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : boards.length === 0 ? (
          <EmptyState
            icon={IconLayoutKanban}
            title="No boards yet"
            description="Create your first board to start orchestrating AI agents"
            actionLabel="Create Board"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onDelete={() => setDeleteId(board._id)}
              />
            ))}
          </div>
        )}
      </Container>

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Board"
        message="Are you sure you want to delete this board? All columns, tasks, and run history will be permanently removed."
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
