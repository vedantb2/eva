"use client";

import { useNavigate } from "@tanstack/react-router";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Spinner,
  cn,
} from "@conductor/ui";
import {
  IconBookmark,
  IconBrain,
  IconFolder,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

interface AnalyseSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function AnalyseSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: AnalyseSidebarProps) {
  const navigate = useNavigate();
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
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  const baseUrl = `${basePath}/analyse`;
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
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    setIsCreateModalOpen(true);
  }, [createRequestId]);

  const handleDelete = async () => {
    if (!queryToDelete) return;
    setIsDeleting(true);
    try {
      await removeQuery({ id: queryToDelete.id });
      setQueryToDelete(null);
      if (currentQueryId === queryToDelete.id) {
        navigate({ to: baseUrl });
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
      navigate({ to: `${baseUrl}/query/${id}` });
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search queries..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-sidebar-primary"
          onClick={() => setIsCreateModalOpen(true)}
          title="New query"
        >
          <IconPlus size={16} />
        </Button>
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
                      <ContextMenu key={query._id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn(
                              "group mx-1 rounded-md px-3 py-2 transition-colors",
                              isSelected
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                            )}
                          >
                            <DynamicLink
                              to={`${baseUrl}/query/${query._id}`}
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
                              </div>
                              <div className="mt-2 flex items-center">
                                <div className="flex -space-x-1">
                                  <UserInitials userId={query.userId} />
                                </div>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {dayjs(query.updatedAt).fromNow()}
                                </span>
                              </div>
                            </DynamicLink>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ContextMenuItem
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
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
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
                <DynamicLink
                  to={`${baseUrl}/saved-queries`}
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
                </DynamicLink>
                <DynamicLink
                  to={`${baseUrl}/routines`}
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
                </DynamicLink>
                <DynamicLink
                  to={`${baseUrl}/files`}
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
                </DynamicLink>
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
