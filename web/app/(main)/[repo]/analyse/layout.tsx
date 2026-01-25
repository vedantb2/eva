"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import {
  IconBrain,
  IconSearch,
  IconPlus,
  IconTrash,
  IconFolder,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";

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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Analyse
          </h2>
          <Button
            size="sm"
            color="primary"
            isIconOnly
            onPress={() => setIsCreateModalOpen(true)}
          >
            <IconPlus size={16} />
          </Button>
        </div>
        <Input
          placeholder="Search queries..."
          startContent={<IconSearch size={16} className="text-default-400 " />}
          className="p-4"
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery("")}
        />
        <div className="flex-1 overflow-y-auto">
          {queries === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600" />
            </div>
          ) : (
            <div className="p-2 space-y-4">
              <div>
                <p className="px-2 mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Queries
                </p>
                {filteredQueries.length === 0 ? (
                  <div className="p-4 text-center">
                    <IconBrain className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    <p className="text-sm text-neutral-500">
                      {queries.length === 0
                        ? "No queries yet"
                        : "No matches found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredQueries.map((query) => {
                      const isSelected = currentQueryId === query._id;
                      return (
                        <div
                          key={query._id}
                          className={`px-3 py-2 rounded-lg cursor-pointer transition-all group ${
                            isSelected
                              ? "bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <Link
                            href={baseUrl + "/query/" + query._id}
                            className="block"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h3
                                className={`text-sm font-medium truncate flex-1 ${
                                  isSelected
                                    ? "text-pink-600 dark:text-pink-400"
                                    : "text-neutral-900 dark:text-white"
                                }`}
                              >
                                {query.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500 flex-shrink-0">
                                  {formatTime(query.updatedAt)}
                                </span>
                                <Tooltip content="Delete query">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setQueryToDelete({
                                        id: query._id,
                                        title: query.title,
                                      });
                                    }}
                                    className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                                  >
                                    <IconTrash size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="px-2 mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Files
                </p>
                <Link
                  href={baseUrl + "/files"}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isFilesPage
                      ? "bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <IconFolder size={18} />
                  <span className="text-sm font-medium">Browse Files</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>

      <Modal isOpen={!!queryToDelete} onClose={() => setQueryToDelete(null)}>
        <ModalContent>
          <ModalHeader>Delete Query</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete{" "}
              <strong>{queryToDelete?.title}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-3">
              This action cannot be undone. All messages in this query will be
              permanently deleted.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setQueryToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete Query
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewQueryTitle("");
        }}
      >
        <ModalContent>
          <ModalHeader>New Query</ModalHeader>
          <ModalBody>
            <Input
              label="Query Title"
              placeholder="e.g., Analyze user metrics"
              value={newQueryTitle}
              onValueChange={setNewQueryTitle}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newQueryTitle.trim()) {
                  handleCreate();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setIsCreateModalOpen(false);
                setNewQueryTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreate}
              isLoading={isCreating}
              isDisabled={!newQueryTitle.trim()}
            >
              Create Query
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
