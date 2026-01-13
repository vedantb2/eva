"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import {
  IconLayoutKanban,
  IconChevronRight,
  IconGitBranch,
  IconTrash,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";

type FeatureStatus = "planning" | "active" | "completed" | "archived";
type SortField = "created" | "title" | "status";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

const statusColors = {
  planning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
};

export function FeaturesClient() {
  const { repo, fullName } = useRepo();
  const features = useQuery(api.features.list, { repoId: repo._id });
  const deleteFeature = useMutation(api.features.deleteCascade);
  const [featureToDelete, setFeatureToDelete] = useState<{
    id: Id<"features">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredAndSortedFeatures = useMemo(() => {
    if (!features) return [];
    let result = [...features];
    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "created":
          comparison = a._creationTime - b._creationTime;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return result;
  }, [features, statusFilter, sortField, sortDirection]);

  const handleDelete = async () => {
    if (!featureToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFeature({ id: featureToDelete.id });
      setFeatureToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Features" />
      <Container>
        {features === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : features.length === 0 ? (
          <EmptyState
            icon={IconLayoutKanban}
            title="No features yet"
            description="Features are created from finalized plans. Create a plan first to get started."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat" size="sm" startContent={<IconFilter size={16} />}>
                      {statusFilter === "all" ? "All Status" : statusFilter}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Filter by status"
                    selectionMode="single"
                    selectedKeys={new Set([statusFilter])}
                    onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as FeatureStatus | "all")}
                  >
                    <DropdownItem key="all">All Status</DropdownItem>
                    <DropdownItem key="planning">Planning</DropdownItem>
                    <DropdownItem key="active">Active</DropdownItem>
                    <DropdownItem key="completed">Completed</DropdownItem>
                    <DropdownItem key="archived">Archived</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={sortDirection === "asc" ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                    >
                      {sortField === "created" ? "Date" : sortField === "title" ? "Title" : "Status"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort by"
                    selectionMode="single"
                    selectedKeys={new Set([sortField])}
                    onSelectionChange={(keys) => setSortField(Array.from(keys)[0] as SortField)}
                  >
                    <DropdownItem key="created">Date Created</DropdownItem>
                    <DropdownItem key="title">Title</DropdownItem>
                    <DropdownItem key="status">Status</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Button
                  variant="flat"
                  size="sm"
                  isIconOnly
                  onPress={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  {sortDirection === "asc" ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                </Button>
              </div>
              <Button
                variant="flat"
                size="sm"
                isIconOnly
                onPress={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
              >
                {viewMode === "grid" ? <IconLayoutList size={16} /> : <IconLayoutGrid size={16} />}
              </Button>
            </div>
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" : "space-y-3"}>
            {filteredAndSortedFeatures.map((feature) => (
              <div
                key={feature._id}
                className="p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={"/" + encodeRepoSlug(fullName) + "/features/" + feature._id}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                    <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={"px-2 py-0.5 text-xs font-medium rounded-full " + statusColors[feature.status]}
                      >
                        {feature.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500 truncate max-w-[150px] sm:max-w-none">
                        <IconGitBranch className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{feature.branchName}</span>
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip content="Delete feature">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeatureToDelete({ id: feature._id, title: feature.title });
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                      >
                        <IconTrash size={18} />
                      </button>
                    </Tooltip>
                    <Link
                      href={"/" + encodeRepoSlug(fullName) + "/features/" + feature._id}
                      className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                    >
                      <IconChevronRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </Container>
      <Modal isOpen={!!featureToDelete} onClose={() => setFeatureToDelete(null)}>
        <ModalContent>
          <ModalHeader>Delete Feature</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete <strong>{featureToDelete?.title}</strong>?
            </p>
            <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <p className="text-sm text-warning-700 dark:text-warning-300">
                This will permanently delete the feature and all associated tasks, subtasks,
                agent runs, and dependencies.
              </p>
            </div>
            <p className="text-sm text-default-500 mt-3">This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setFeatureToDelete(null)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
              Delete Feature
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
