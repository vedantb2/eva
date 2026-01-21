"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
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
  IconSearch,
  IconNotes,
  IconCheck,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Input } from "@heroui/input";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Tooltip } from "@heroui/tooltip";
import { useState, useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

type PlanState = "draft" | "finalized" | "feature_created";
type SortField = "created" | "title";
type SortDirection = "asc" | "desc";

const ALL_STATES: PlanState[] = ["draft", "finalized", "feature_created"];

const stateConfig: Record<
  PlanState,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    icon: typeof IconNotes;
  }
> = {
  draft: {
    label: "Draft",
    badgeBg: "bg-neutral-100 dark:bg-neutral-700",
    badgeText: "text-neutral-600 dark:text-neutral-300",
    cardBg: "bg-neutral-50 dark:bg-neutral-800",
    icon: IconNotes,
  },
  finalized: {
    label: "Finalized",
    badgeBg: "bg-yellow-100 dark:bg-yellow-900/30",
    badgeText: "text-yellow-700 dark:text-yellow-400",
    cardBg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: IconCheck,
  },
  feature_created: {
    label: "Feature Created",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    badgeText: "text-green-700 dark:text-green-400",
    cardBg: "bg-green-50 dark:bg-green-900/20",
    icon: IconCircleCheck,
  },
};

export function PlansClient() {
  const { repo, fullName } = useRepo();
  const plans = useQuery(api.plans.list, { repoId: repo._id });
  const deletePlan = useMutation(api.plans.deleteCascade);
  const [isCreating, setIsCreating] = useState(false);
  const [interviewPlanId, setInterviewPlanId] = useState<Id<"plans"> | null>(
    null
  );
  const [visibleStates, setVisibleStates] = useState<Set<PlanState>>(
    new Set(ALL_STATES)
  );
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [planToDelete, setPlanToDelete] = useState<{
    id: Id<"plans">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const plansByState = useMemo(() => {
    if (!plans) return {} as Record<PlanState, typeof plans>;
    const query = searchQuery.toLowerCase().trim();
    const grouped = ALL_STATES.reduce((acc, state) => {
      acc[state] = plans
        .filter((p) => p.state === state)
        .filter((p) => {
          if (!query) return true;
          return (
            p.title.toLowerCase().includes(query) ||
            p.rawInput?.toLowerCase().includes(query)
          );
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
    }, {} as Record<PlanState, typeof plans>);
    return grouped;
  }, [plans, sortField, sortDirection, searchQuery]);

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

  const handleStateToggle = (keys: Set<string>) => {
    const newStates = new Set(Array.from(keys) as PlanState[]);
    if (newStates.size === 0) return;
    setVisibleStates(newStates);
  };

  return (
    <>
      <PageWrapper
        title="Plan"
        headerRight={
          <Button onPress={() => setIsCreating(true)}>
            <IconPlus size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">New Plan</span>
          </Button>
        }
      >
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={<IconFilter size={16} />}
                    >
                      {visibleStates.size === ALL_STATES.length
                        ? "All Columns"
                        : `${visibleStates.size} Columns`}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Toggle columns"
                    selectionMode="multiple"
                    selectedKeys={visibleStates}
                    onSelectionChange={(keys) =>
                      handleStateToggle(keys as Set<string>)
                    }
                    closeOnSelect={false}
                  >
                    <DropdownItem key="draft">Draft</DropdownItem>
                    <DropdownItem key="finalized">Finalized</DropdownItem>
                    <DropdownItem key="feature_created">
                      Feature Created
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={
                        sortDirection === "asc" ? (
                          <IconSortAscending size={16} />
                        ) : (
                          <IconSortDescending size={16} />
                        )
                      }
                    >
                      {sortField === "created" ? "Date" : "Title"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort by"
                    selectionMode="single"
                    selectedKeys={new Set([sortField])}
                    onSelectionChange={(keys) =>
                      setSortField(Array.from(keys)[0] as SortField)
                    }
                  >
                    <DropdownItem key="created">Date Created</DropdownItem>
                    <DropdownItem key="title">Title</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Button
                  variant="flat"
                  size="sm"
                  isIconOnly
                  onPress={() =>
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortDirection === "asc" ? (
                    <IconSortAscending size={16} />
                  ) : (
                    <IconSortDescending size={16} />
                  )}
                </Button>
              </div>
              <Input
                placeholder="Search plans..."
                size="sm"
                className="w-48"
                startContent={
                  <IconSearch size={16} className="text-default-400" />
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ALL_STATES.filter((state) => visibleStates.has(state)).map(
                (state) => (
                  <div
                    key={state}
                    className="min-w-[280px] max-w-[320px] flex-shrink-0 bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = stateConfig[state].icon;
                          return (
                            <Icon
                              size={16}
                              className={stateConfig[state].badgeText}
                            />
                          );
                        })()}
                        <span className="font-medium text-sm">
                          {stateConfig[state].label}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${stateConfig[state].badgeBg} ${stateConfig[state].badgeText}`}
                        >
                          {plansByState[state]?.length ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {plansByState[state]?.map((plan) => {
                        const canInterview = plan.state !== "feature_created";
                        const planUrl =
                          "/" + encodeRepoSlug(fullName) + "/plan/" + plan._id;
                        return (
                          <div
                            key={plan._id}
                            className={`p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all group ${stateConfig[state].cardBg}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Link href={planUrl} className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                                  {plan.title}
                                </h3>
                                {plan.rawInput && (
                                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                    {plan.rawInput}
                                  </p>
                                )}
                              </Link>
                              <div className="flex items-center gap-1 flex-shrink-0">
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
                                      if (canInterview)
                                        setInterviewPlanId(plan._id);
                                    }}
                                    disabled={!canInterview}
                                    className={`p-1 rounded-lg transition-colors ${
                                      canInterview
                                        ? "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-pink-600"
                                        : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                                    }`}
                                  >
                                    <IconMessageQuestion size={16} />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete plan">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPlanToDelete({
                                        id: plan._id,
                                        title: plan.title,
                                      });
                                    }}
                                    className="p-1 rounded-lg transition-colors hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                                  >
                                    <IconTrash size={16} />
                                  </button>
                                </Tooltip>
                                <Link
                                  href={planUrl}
                                  className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                                >
                                  <IconChevronRight size={18} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(plansByState[state]?.length ?? 0) === 0 && (
                        <p className="text-xs text-neutral-400 text-center py-4">
                          No plans
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </PageWrapper>
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
              Are you sure you want to delete{" "}
              <strong>{planToDelete?.title}</strong>? This will also delete all
              associated messages. This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPlanToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
