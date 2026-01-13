"use client";

import { useState, useCallback } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { GenericId as Id } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { ChatTab } from "./ChatTab";
import { PlanTab } from "./PlanTab";
import { PlanFinalizationModal } from "./PlanFinalizationModal";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type PlanState = "draft" | "finalized" | "feature_created";

interface PlanTabsProps {
  planId: Id<"plans">;
  planState: PlanState;
  rawInput: string;
  generatedSpec: string | undefined;
  conversationHistory: ConversationMessage[];
  repoSlug: string;
}

export function PlanTabs({
  planId,
  planState,
  rawInput,
  generatedSpec,
  conversationHistory,
  repoSlug,
}: PlanTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(generatedSpec ? "plan" : "chat");
  const [pendingSpec, setPendingSpec] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInterview, setIsInterview] = useState(false);
  const updatePlan = useMutation(api.plans.update);

  const handleSpecGenerated = useCallback(async (spec: string) => {
    setPendingSpec(spec);
    await updatePlan({ id: planId, generatedSpec: spec, state: "finalized" });
    setShowModal(true);
  }, [planId, updatePlan]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setActiveTab("plan");
  }, []);

  const handleStartInterview = useCallback(() => {
    setIsInterview(true);
    setActiveTab("chat");
  }, []);

  const handleGoToChat = useCallback(() => {
    setActiveTab("chat");
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-divider px-4">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          variant="underlined"
          classNames={{
            tabList: "gap-4",
            cursor: "bg-primary",
            tab: "px-0 h-12",
          }}
        >
          <Tab key="chat" title="Chat" />
          <Tab key="plan" title="Plan" />
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <ChatTab
            planId={planId}
            planState={planState}
            initialMessages={conversationHistory}
            rawInput={rawInput}
            onSpecGenerated={handleSpecGenerated}
            isInterview={isInterview}
          />
        ) : (
          <PlanTab
            planId={planId}
            planState={planState}
            generatedSpec={pendingSpec || generatedSpec}
            repoSlug={repoSlug}
            onStartInterview={handleStartInterview}
          />
        )}
      </div>
      {pendingSpec && (
        <PlanFinalizationModal
          isOpen={showModal}
          onClose={handleModalClose}
          planId={planId}
          spec={pendingSpec}
          repoSlug={repoSlug}
        />
      )}
    </div>
  );
}
