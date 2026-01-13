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
  IconSearch,
} from "@tabler/icons-react";
import { Input } from "@heroui/input";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";

type FeatureStatus = "planning" | "active" | "completed";
type SortField = "created" | "title";
type SortDirection = "asc" | "desc";

const ALL_STATUSES: FeatureStatus[] = ["planning", "active", "completed"];

const statusConfig: Record<FeatureStatus, { label: string; badgeBg: string; badgeText: string; cardBg: string }> = {
  planning: { label: "Planning", badgeBg: "bg-neutral-100 dark:bg-neutral-700", badgeText: "text-neutral-600 dark:text-neutral-300", cardBg: "bg-neutral-50 dark:bg-neutral-800" },
  active: { label: "Active", badgeBg: "bg-yellow-100 dark:bg-yellow-900/30", badgeText: "text-yellow-700 dark:text-yellow-400", cardBg: "bg-yellow-50 dark:bg-yellow-900/20" },
  completed: { label: "Completed", badgeBg: "bg-green-100 dark:bg-green-900/30", badgeText: "text-green-700 dark:text-green-400", cardBg: "bg-green-50 dark:bg-green-900/20" },
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
  const [visibleStatuses, setVisibleStatuses] = useState<Set<FeatureStatus>>(new Set(ALL_STATUSES));
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const featuresByStatus = useMemo(() => {
    if (!features) return {} as Record<FeatureStatus, typeof features>;
    const query = searchQuery.toLowerCase().trim();
    const grouped = ALL_STATUSES.reduce((acc, status) => {
      acc[status] = features
        .filter((f) => f.status === status)
        .filter((f) => {
          if (!query) return true;
          return f.title.toLowerCase().includes(query) || f.description?.toLowerCase().includes(query);
        })
        .sort((a, b) => {
          let comparison = 0;
          switch (sortField) {
            case "created":
              comparison = a._creationTime - b._creationTime;
              break;
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
          }
          return sortDirection === "asc" ? comparison : -comparison;
        });
      return acc;
    }, {} as Record<FeatureStatus, typeof features>);
    return grouped;
  }, [features, sortField, sortDirection, searchQuery]);

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

  const handleStatusToggle = (keys: Set<string>) => {
    const newStatuses = new Set(Array.from(keys) as FeatureStatus[]);
    if (newStatuses.size === 0) return;
    setVisibleStatuses(newStatuses);
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
                      {visibleStatuses.size === ALL_STATUSES.length
                        ? "All Columns"
                        : `${visibleStatuses.size} Columns`}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Toggle columns"
                    selectionMode="multiple"
                    selectedKeys={visibleStatuses}
                    onSelectionChange={(keys) => handleStatusToggle(keys as Set<string>)}
                    closeOnSelect={false}
                  >
                    <DropdownItem key="planning">Planning</DropdownItem>
                    <DropdownItem key="active">Active</DropdownItem>
                    <DropdownItem key="completed">Completed</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={sortDirection === "asc" ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                    >
                      {sortField === "created" ? "Date" : "Title"}
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
              <Input
                placeholder="Search features..."
                size="sm"
                className="w-48"
                startContent={<IconSearch size={16} className="text-default-400" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ALL_STATUSES.filter((status) => visibleStatuses.has(status)).map((status) => (
                <div
                  key={status}
                  className="min-w-[280px] max-w-[320px] flex-shrink-0 bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{statusConfig[status].label}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[status].badgeBg} ${statusConfig[status].badgeText}`}>
                        {featuresByStatus[status]?.length ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {featuresByStatus[status]?.map((feature) => (
                      <div
                        key={feature._id}
                        className={`p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all group ${statusConfig[status].cardBg}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={"/" + encodeRepoSlug(fullName) + "/features/" + feature._id}
                            className="flex-1 min-w-0"
                          >
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                              {feature.title}
                            </h3>
                            {feature.description && (
                              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                {feature.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 truncate">
                              <IconGitBranch className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{feature.branchName}</span>
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
                                className="p-1 rounded-lg transition-colors hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                              >
                                <IconTrash size={16} />
                              </button>
                            </Tooltip>
                            <Link
                              href={"/" + encodeRepoSlug(fullName) + "/features/" + feature._id}
                              className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                            >
                              <IconChevronRight size={18} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(featuresByStatus[status]?.length ?? 0) === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-4">No features</p>
                    )}
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
