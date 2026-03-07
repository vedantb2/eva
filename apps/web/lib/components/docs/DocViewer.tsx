"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import {
  ActivitySteps,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Input,
  Spinner,
  Textarea,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconPlus,
  IconX,
  IconGripVertical,
  IconInfoCircle,
  IconMessageChatbot,
  IconHistory,
  IconTestPipe,
  IconExternalLink,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useRepo } from "@/lib/contexts/RepoContext";
import { DocInterviewDialog } from "./DocInterviewDialog";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

function ConfirmDeleteButton({
  onConfirm,
  label,
}: {
  onConfirm: () => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8"
      >
        <IconX size={14} />
      </Button>
      <DialogContent hideCloseButton className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DocViewer({ doc }: { doc: Doc }) {
  return <DocEditor key={doc._id} doc={doc} />;
}

function DocEditor({ doc }: { doc: Doc }) {
  const { installationId } = useRepo();
  const streaming = useQuery(api.streaming.get, { entityId: doc._id });
  const streamingSteps = parseActivitySteps(streaming?.currentActivity);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isTriggeringTestGen, setIsTriggeringTestGen] = useState(false);
  const startTestGenMutation = useMutation(api.testGenWorkflow.startTestGen);
  const updateDoc = useMutation(api.docs.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.docs.get, { id: args.id });
      if (current) {
        localStore.setQuery(
          api.docs.get,
          { id: args.id },
          {
            ...current,
            ...args,
            updatedAt: Date.now(),
          },
        );
      }
    },
  );

  const addRequirement = () => {
    updateDoc({ id: doc._id, requirements: [...(doc.requirements ?? []), ""] });
  };

  const updateRequirement = (idx: number, val: string) => {
    const next = (doc.requirements ?? []).map((r, i) => (i === idx ? val : r));
    updateDoc({ id: doc._id, requirements: next });
  };

  const removeRequirement = (idx: number) => {
    const next = (doc.requirements ?? []).filter((_, i) => i !== idx);
    updateDoc({ id: doc._id, requirements: next });
  };

  const addFlow = () => {
    updateDoc({
      id: doc._id,
      userFlows: [...(doc.userFlows ?? []), { name: "", steps: [""] }],
    });
  };

  const removeFlow = (flowIdx: number) => {
    const next = (doc.userFlows ?? []).filter((_, i) => i !== flowIdx);
    updateDoc({ id: doc._id, userFlows: next });
  };

  const updateFlowName = (flowIdx: number, name: string) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx ? { ...flow, name } : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const addStep = (flowIdx: number) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx ? { ...flow, steps: [...flow.steps, ""] } : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const removeStep = (flowIdx: number, stepIdx: number) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx
        ? { ...flow, steps: flow.steps.filter((_, j) => j !== stepIdx) }
        : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const updateStep = (flowIdx: number, stepIdx: number, val: string) => {
    const next = (doc.userFlows ?? []).map((flow, i) =>
      i === flowIdx
        ? {
            ...flow,
            steps: flow.steps.map((s, j) => (j === stepIdx ? val : s)),
          }
        : flow,
    );
    updateDoc({ id: doc._id, userFlows: next });
  };

  const handleGenerateTests = async () => {
    if (isTriggeringTestGen || doc.testGenStatus === "running") return;
    setIsTriggeringTestGen(true);
    try {
      await startTestGenMutation({
        docId: doc._id,
        installationId,
      });
    } finally {
      setIsTriggeringTestGen(false);
    }
  };

  const isGeneratingTests =
    doc.testGenStatus === "running" || isTriggeringTestGen;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Input
          value={doc.title}
          onChange={(e) => updateDoc({ id: doc._id, title: e.target.value })}
          className="h-10 w-full text-lg font-semibold sm:max-w-md sm:w-auto"
          placeholder="Document title"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setInterviewOpen(true)}
        >
          <IconMessageChatbot size={16} />
          <span className="hidden sm:inline">Interview Me</span>
        </Button>
        {doc.testGenStatus === "completed" && doc.testPrUrl ? (
          <Button size="sm" variant="secondary" asChild>
            <a href={doc.testPrUrl} target="_blank" rel="noopener noreferrer">
              <IconExternalLink size={16} />
              <span className="hidden sm:inline">View Tests PR</span>
            </a>
          </Button>
        ) : isGeneratingTests ? (
          <Button size="sm" variant="secondary" disabled>
            <Spinner size="sm" />
            <span className="hidden sm:inline">Generating...</span>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={handleGenerateTests}>
            <IconTestPipe size={16} />
            <span className="hidden sm:inline">Generate Tests</span>
          </Button>
        )}
        {(doc.interviewHistory ?? []).length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHistoryOpen(true)}
          >
            <IconHistory size={16} />
            <span className="hidden sm:inline">View History</span>
          </Button>
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
          {dayjs(doc.updatedAt).fromNow()}
        </span>
      </div>
      <DocInterviewDialog
        doc={doc}
        open={interviewOpen}
        onOpenChange={setInterviewOpen}
        installationId={installationId}
      />
      <DocInterviewDialog
        doc={doc}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        installationId={installationId}
        readOnly
      />
      {streaming && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Spinner size="sm" />
              <span>
                {isGeneratingTests
                  ? "Generating tests..."
                  : "Processing PRD..."}
              </span>
            </div>
            {streamingSteps ? (
              <ActivitySteps steps={streamingSteps} isStreaming />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {streaming.currentActivity}
              </p>
            )}
          </div>
        </div>
      )}

      <Tabs
        defaultValue="requirements"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4">
          <TabsList>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="user-flows">User Flows</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="requirements"
          className="flex-1 overflow-y-auto scrollbar p-3 space-y-4 mt-0 sm:p-6 sm:space-y-6"
        >
          <section>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={doc.description ?? ""}
              onChange={(e) =>
                updateDoc({ id: doc._id, description: e.target.value })
              }
              placeholder="What does this page or feature do?"
              rows={2}
              className="bg-card"
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                Requirements
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle
                      size={14}
                      className="text-muted-foreground"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Used for code-level testing and evaluation
                  </TooltipContent>
                </Tooltip>
              </label>
              <Button size="sm" variant="secondary" onClick={addRequirement}>
                <IconPlus size={14} />
                Add
              </Button>
            </div>
            {(doc.requirements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No requirements yet. Add items that should be verified during
                testing.
              </p>
            ) : (
              <div className="space-y-2">
                {(doc.requirements ?? []).map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <IconGripVertical
                      size={14}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(idx, e.target.value)}
                      placeholder="e.g. Users can log in with email"
                      className="h-8 text-sm bg-card"
                    />
                    <ConfirmDeleteButton
                      onConfirm={() => removeRequirement(idx)}
                      label="requirement"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent
          value="user-flows"
          className="flex-1 overflow-y-auto scrollbar p-3 space-y-4 mt-0 sm:p-6 sm:space-y-6"
        >
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                User Flows
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle
                      size={14}
                      className="text-muted-foreground"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Used for UI testing in the testing arena
                  </TooltipContent>
                </Tooltip>
              </label>
              <Button size="sm" variant="secondary" onClick={addFlow}>
                <IconPlus size={14} />
                Add Flow
              </Button>
            </div>
            {(doc.userFlows ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No user flows yet. Add step-by-step flows to test in the UI
                testing tab.
              </p>
            ) : (
              <div className="space-y-4">
                {(doc.userFlows ?? []).map((flow, flowIdx) => (
                  <div
                    key={flowIdx}
                    className="border border-border rounded-lg p-3 bg-card sm:p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={flow.name}
                        onChange={(e) =>
                          updateFlowName(flowIdx, e.target.value)
                        }
                        placeholder={`Flow ${flowIdx + 1}`}
                        className="h-8 text-sm bg-background"
                      />
                      <ConfirmDeleteButton
                        onConfirm={() => removeFlow(flowIdx)}
                        label="flow"
                      />
                    </div>
                    <div className="space-y-2">
                      {flow.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0 tabular-nums">
                            {stepIdx + 1}.
                          </span>
                          <Input
                            value={step}
                            onChange={(e) =>
                              updateStep(flowIdx, stepIdx, e.target.value)
                            }
                            placeholder="Describe this step"
                            className="h-8 text-sm bg-background"
                          />
                          <ConfirmDeleteButton
                            onConfirm={() => removeStep(flowIdx, stepIdx)}
                            label="step"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addStep(flowIdx)}
                      className="mt-2 text-muted-foreground"
                    >
                      <IconPlus size={14} />
                      Add Step
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
