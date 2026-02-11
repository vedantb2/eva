"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import {
  Button,
  Input,
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
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useRepo } from "@/lib/contexts/RepoContext";
import { DocInterviewDialog } from "./DocInterviewDialog";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

export function DocViewer({ doc }: { doc: Doc }) {
  return <DocEditor key={doc._id} doc={doc} />;
}

function DocEditor({ doc }: { doc: Doc }) {
  const { installationId } = useRepo();
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Input
          value={doc.title}
          onChange={(e) => updateDoc({ id: doc._id, title: e.target.value })}
          className="max-w-md h-10 text-lg font-semibold"
          placeholder="Document title"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setInterviewOpen(true)}
        >
          <IconMessageChatbot size={16} />
          Interview Me
        </Button>
        {(doc.interviewHistory ?? []).length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHistoryOpen(true)}
          >
            <IconHistory size={16} />
            View History
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
          className="flex-1 overflow-y-auto scrollbar p-6 space-y-6 mt-0"
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRequirement(idx)}
                      className="text-muted-foreground hover:text-red-500 flex-shrink-0 h-8 w-8"
                    >
                      <IconX size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent
          value="user-flows"
          className="flex-1 overflow-y-auto scrollbar p-6 space-y-6 mt-0"
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
                    className="border border-border rounded-lg p-4 bg-card"
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFlow(flowIdx)}
                        className="text-muted-foreground hover:text-red-500 flex-shrink-0 h-8 w-8"
                      >
                        <IconX size={14} />
                      </Button>
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
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStep(flowIdx, stepIdx)}
                            className="text-muted-foreground hover:text-red-500 flex-shrink-0 h-8 w-8"
                          >
                            <IconX size={14} />
                          </Button>
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
