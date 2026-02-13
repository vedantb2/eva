"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Spinner,
  cn,
} from "@conductor/ui";
import {
  IconBookmark,
  IconBrain,
  IconDotsVertical,
  IconFolder,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface AnalyseSidebarProps {
  repoId: Id<"githubRepos">;
  repoSlug: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function AnalyseSidebar({
  repoId,
  repoSlug,
  pathname,
  onNavigate,
  createRequestId,
}: AnalyseSidebarProps) {
  const router = useRouter();
  const queries = useQuery(api.researchQueries.list, { repoId });
  const createQuery = useMutation(api.researchQueries.create);
  const removeQuery = useMutation(api.researchQueries.remove);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQueryTitle, setNewQueryTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<{
    id: Id<"researchQueries">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseUrl = `/${repoSlug}/analyse`;
  const currentQueryId = pathname.includes("/query/")
    ? pathname.split("/query/")[1]?.split("/")[0]
    : null;
  const isFilesPage = pathname.startsWith(`${baseUrl}/files`);
  const isSavedQueriesPage = pathname.startsWith(`${baseUrl}/saved-queries`);
  const isRoutinesPage = pathname.startsWith(`${baseUrl}/routines`);

  const filteredQueries = useMemo(() => {
    if (!queries) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? queries.filter((item) => item.title.toLowerCase().includes(query))
      : queries;
  }, [queries, searchQuery]);

  useEffect(() => {
    if (createRequestId && createRequestId > 0) {
      setIsCreateModalOpen(true);
    }
  }, [createRequestId]);

  const handleDelete = async () => {
    if (!queryToDelete) return;
    setIsDeleting(true);
    try {
      await removeQuery({ id: queryToDelete.id });
      setQueryToDelete(null);
      if (currentQueryId === queryToDelete.id) {
        router.push(baseUrl);
        onNavigate?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!newQueryTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await createQuery({
        repoId,
        title: newQueryTitle.trim(),
      });
      setNewQueryTitle("");
      setIsCreateModalOpen(false);
      router.push(`${baseUrl}/query/${id}`);
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="p-2">
        <div className="relative">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search queries..."
            className="h-8 border-sidebar-border/80 bg-sidebar/70 px-8 text-sm text-sidebar-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {queries === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="space-y-5 pb-2">
            <div>
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Queries
              </p>
              {filteredQueries.length === 0 ? (
                <div className="p-4 text-center">
                  <IconBrain
                    size={28}
                    className="mx-auto mb-2 text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    {queries.length === 0
                      ? "No queries yet"
                      : "No matches found"}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredQueries.map((query) => {
                    const isSelected = currentQueryId === query._id;
                    return (
                      <div
                        key={query._id}
                        className={cn(
                          "group mx-1 rounded-md px-3 py-2 transition-colors",
                          isSelected
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                        )}
                      >
                        <Link
                          href={`${baseUrl}/query/${query._id}`}
                          onClick={onNavigate}
                          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className={cn(
                                "truncate text-sm font-medium",
                                isSelected
                                  ? "text-sidebar-primary"
                                  : "text-sidebar-foreground",
                              )}
                            >
                              {query.title}
                            </h3>
                            <div
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  >
                                    <IconDotsVertical size={13} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      setQueryToDelete({
                                        id: query._id,
                                        title: query.title,
                                      })
                                    }
                                  >
                                    <IconTrash size={16} />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center">
                            <div className="flex -space-x-1">
                              {[
                                ...new Set(
                                  query.messages.map(
                                    (message) => message.userId,
                                  ),
                                ),
                              ]
                                .filter(Boolean)
                                .map((id) => (
                                  <UserInitials key={id} userId={id!} />
                                ))}
                            </div>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {dayjs(query.updatedAt).fromNow()}
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Resources
              </p>
              <div className="space-y-1">
                <Link
                  href={`${baseUrl}/saved-queries`}
                  onClick={onNavigate}
                  className={cn(
                    "mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isSavedQueriesPage
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <IconBookmark size={14} />
                  <span>Saved queries</span>
                </Link>
                <Link
                  href={`${baseUrl}/routines`}
                  onClick={onNavigate}
                  className={cn(
                    "mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isRoutinesPage
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <IconRefresh size={14} />
                  <span>Routines</span>
                </Link>
                <Link
                  href={`${baseUrl}/files`}
                  onClick={onNavigate}
                  className={cn(
                    "mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isFilesPage
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <IconFolder size={14} />
                  <span>Files</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!queryToDelete}
        onOpenChange={(open) => {
          if (!open) setQueryToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Query</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{queryToDelete?.title}</strong>?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQueryToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setNewQueryTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Query Title</label>
            <Input
              placeholder="e.g., Analyze user metrics"
              value={newQueryTitle}
              onChange={(event) => setNewQueryTitle(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && newQueryTitle.trim()) {
                  void handleCreate();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewQueryTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newQueryTitle.trim()}
            >
              {isCreating ? <Spinner size="sm" /> : "Create Query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
