"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import { Skeleton } from "@/lib/components/ui/Skeleton";
import {
  IconBrain,
  IconSearch,
  IconTrash,
  IconDotsVertical,
  IconFolder,
  IconBookmark,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import dayjs from "@/lib/dates";

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { repo, fullName } = useRepo();
  const router = useRouter();
  const pathname = usePathname();
  const queries = useQuery(api.researchQueries.list, { repoId: repo._id });
  const createQuery = useMutation(api.researchQueries.create);
  const removeQuery = useMutation(api.researchQueries.remove);
  const [queryToDelete, setQueryToDelete] = useState<{
    id: Id<"researchQueries">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQueryTitle, setNewQueryTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const baseUrl = "/" + encodeRepoSlug(fullName) + "/analyse";
  const currentQueryId = pathname.includes("/query/")
    ? pathname.split("/query/")[1]?.split("/")[0]
    : null;
  const isFilesPage = pathname.endsWith("/files");
  const isSavedQueriesPage = pathname.endsWith("/saved-queries");
  const isRoutinesPage = pathname.endsWith("/routines");

  const filteredQueries = useMemo(() => {
    if (!queries) return [];
    const search = searchQuery.toLowerCase().trim();
    if (!search) return queries;
    return queries.filter((q) => q.title.toLowerCase().includes(search));
  }, [queries, searchQuery]);

  const handleDelete = async () => {
    if (!queryToDelete) return;
    setIsDeleting(true);
    try {
      await removeQuery({ id: queryToDelete.id });
      setQueryToDelete(null);
      if (currentQueryId === queryToDelete.id) {
        router.push(baseUrl);
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
        repoId: repo._id,
        title: newQueryTitle.trim(),
      });
      setNewQueryTitle("");
      setIsCreateModalOpen(false);
      router.push(baseUrl + "/query/" + id);
    } finally {
      setIsCreating(false);
    }
  };

  const sidebar = (
    <>
      <div className="p-3 relative">
        <IconSearch
          size={16}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search queries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <IconX size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {queries === undefined ? (
          <div className="px-3 py-2 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-3 py-2.5 mx-2 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 space-y-8">
            <div>
              <p className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Queries
              </p>
              {filteredQueries.length === 0 ? (
                <div className="p-4 text-center">
                  <IconBrain
                    size={32}
                    className="mx-auto text-muted-foreground mb-2"
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
                        className={`px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all group ${
                          isSelected ? "bg-accent" : "hover:bg-muted"
                        }`}
                      >
                        <Link
                          href={baseUrl + "/query/" + query._id}
                          className="block"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className={`text-sm font-medium truncate flex-1 ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {query.title}
                            </h3>
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100"
                                  >
                                    <IconDotsVertical size={14} />
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
                                  query.messages
                                    .filter((m) => m.userId)
                                    .map((m) => m.userId),
                                ),
                              ].map((id) => (
                                <UserInitials key={id} userId={id!} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {dayjs(query._creationTime).fromNow()}
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
              <p className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resources
              </p>
              <div>
                <Link
                  href={baseUrl + "/saved-queries"}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                    isSavedQueriesPage
                      ? "bg-accent text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <IconBookmark size={14} />
                  <span className="text-sm font-medium">Saved queries</span>
                </Link>
                <Link
                  href={baseUrl + "/routines"}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                    isRoutinesPage
                      ? "bg-accent text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <IconRefresh size={14} />
                  <span className="text-sm font-medium">Routines</span>
                </Link>
                <Link
                  href={baseUrl + "/files"}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-colors ${
                    isFilesPage
                      ? "bg-accent text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <IconFolder size={14} />
                  <span className="text-sm font-medium">Files</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <SidebarLayoutWrapper
      title="Analyse"
      onAdd={() => setIsCreateModalOpen(true)}
      sidebar={sidebar}
    >
      {children}

      <Dialog
        open={!!queryToDelete}
        onOpenChange={(v) => {
          if (!v) setQueryToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Query</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong>{queryToDelete?.title}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              This action cannot be undone. All messages in this query will be
              permanently deleted.
            </p>
          </div>
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
        onOpenChange={(v) => {
          if (!v) {
            setIsCreateModalOpen(false);
            setNewQueryTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Query</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Query Title
            </label>
            <Input
              placeholder="e.g., Analyze user metrics"
              value={newQueryTitle}
              onChange={(e) => setNewQueryTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newQueryTitle.trim()) {
                  handleCreate();
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
              disabled={!newQueryTitle.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayoutWrapper>
  );
}
