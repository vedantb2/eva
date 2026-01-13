"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@heroui/button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { PlanStatusBadge } from "@/lib/components/plans/PlanStatusBadge";
import { NewPlanModal } from "@/lib/components/plans/NewPlanModal";
import { PlanInterviewModal } from "@/lib/components/plans/PlanInterviewModal";
import {
  IconSparkles,
  IconPlus,
  IconChevronRight,
  IconMessageQuestion,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Tooltip } from "@heroui/tooltip";
import { useState, useMemo } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

type PlanState = "draft" | "finalized" | "feature_created";
type SortField = "created" | "title" | "status";
type SortDirection = "asc" | "desc";

export function PlansClient() {
  const { repo, fullName } = useRepo();
  const plans = useQuery(api.plans.list, { repoId: repo._id });
  const deletePlan = useMutation(api.plans.deleteCascade);
  const [isCreating, setIsCreating] = useState(false);
  const [interviewPlanId, setInterviewPlanId] = useState<Id<"plans"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<PlanState | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [planToDelete, setPlanToDelete] = useState<{ id: Id<"plans">; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAndSortedPlans = useMemo(() => {
    if (!plans) return [];
    let result = [...plans];
    if (statusFilter !== "all") {
      result = result.filter((p) => p.state === statusFilter);
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
          comparison = a.state.localeCompare(b.state);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return result;
  }, [plans, statusFilter, sortField, sortDirection]);

  const handleDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await deletePlan({ id: planToDelete.id });
      setPlanToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Plan"
        headerRight={
          <Button onPress={() => setIsCreating(true)} size="sm">
            <IconPlus size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">New Plan</span>
          </Button>
        }
      />
      <Container>
        {plans === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={IconSparkles}
            title="No plans yet"
            description="Create a plan to describe a feature and let AI help you break it down into tasks"
            actionLabel="Create Plan"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="flat" size="sm" startContent={<IconFilter size={16} />}>
                    {statusFilter === "all" ? "All Status" : statusFilter.replace("_", " ")}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Filter by status"
                  selectionMode="single"
                  selectedKeys={new Set([statusFilter])}
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as PlanState | "all")}
                >
                  <DropdownItem key="all">All Status</DropdownItem>
                  <DropdownItem key="draft">Draft</DropdownItem>
                  <DropdownItem key="finalized">Finalized</DropdownItem>
                  <DropdownItem key="feature_created">Feature Created</DropdownItem>
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
            {filteredAndSortedPlans.map((plan) => {
              const canInterview = plan.state !== "feature_created";
              const planUrl =
                "/" + encodeRepoSlug(fullName) + "/plan/" + plan._id;
              return (
                <div
                  key={plan._id}
                  className="p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <Link href={planUrl} className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate max-w-full">
                          {plan.title}
                        </h3>
                        <PlanStatusBadge state={plan.state} />
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {plan.rawInput}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Tooltip
                        content={
                          canInterview
                            ? "Interview to refine requirements"
                            : "Feature already created - plan is locked"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (canInterview) setInterviewPlanId(plan._id);
                          }}
                          disabled={!canInterview}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            canInterview
                              ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 hover:text-pink-600"
                              : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                          }`}
                        >
                          <IconMessageQuestion size={18} className="sm:hidden" />
                          <IconMessageQuestion size={20} className="hidden sm:block" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete plan">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlanToDelete({ id: plan._id, title: plan.title });
                          }}
                          className="p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                        >
                          <IconTrash size={18} className="sm:hidden" />
                          <IconTrash size={20} className="hidden sm:block" />
                        </button>
                      </Tooltip>
                      <Link
                        href={planUrl}
                        className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                      >
                        <IconChevronRight size={18} className="sm:hidden" />
                        <IconChevronRight size={20} className="hidden sm:block" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
      <NewPlanModal isOpen={isCreating} onClose={() => setIsCreating(false)} />
      {interviewPlanId && (
        <PlanInterviewModal
          isOpen={!!interviewPlanId}
          onClose={() => setInterviewPlanId(null)}
          planId={interviewPlanId}
        />
      )}
      <Modal isOpen={!!planToDelete} onClose={() => setPlanToDelete(null)}>
        <ModalContent>
          <ModalHeader>Delete Plan</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete <strong>{planToDelete?.title}</strong>? This will
              also delete all associated messages. This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPlanToDelete(null)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
