import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { useEffect, useState } from "react";
import { Spinner } from "@eva/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { DesignChatPanel } from "./_components/DesignChatPanel";
import {
  DesignPreviewPanel,
  getLatestVariations,
} from "./_components/DesignPreviewPanel";

export function DesignDetailClient({
  designSessionId,
}: {
  designSessionId: Id<"designSessions">;
}) {
  const session = useQuery(api.designSessions.get, { id: designSessionId });
  const messages = useQuery(api.messages.listByParent, {
    parentId: designSessionId,
  });
  const { basePath, repo: _repo } = useRepo();
  const selectVariation = useMutation(api.designSessions.selectVariation);
  const startSandboxMutation = useMutation(api.designSessions.startSandbox);
  const stopSandboxMutation = useMutation(api.designSessions.stopSandbox);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const [isStopPending, setIsStopPending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isSandboxStarting = session?.status === "starting";
  // `stopping` is a transient backend state set synchronously by `stopSandbox`,
  // cleared once Daytona's stop call completes (~10s). Showing the spinner
  // (and disabling Start) for its full duration prevents the stop/start race
  // that previously orphaned sandboxes.
  const isSandboxStopping = session?.status === "stopping";
  const isSandboxActive = session?.status === "active";

  async function fetchPreviewUrl() {
    if (!session?.sandboxId) {
      setPreviewUrl(null);
      return;
    }
    // Never resolve the preview for a stopped/stopping design session. This
    // effect runs on mount, and getPreviewUrl execs on the sandbox to bring up
    // the auth proxy; on Vercel any exec lazily resumes a stopped VM (SDK
    // withResume), silently resurrecting a sandbox the user stopped (status
    // stays "closed"). A closed session keeps its sandboxId, so gate here — and
    // pass checkReady so the backend's handle.state guard is the last defence.
    if (session.status === "closed" || session.status === "stopping") {
      setPreviewUrl(null);
      return;
    }
    try {
      const data = await getPreviewUrl({
        sandboxId: session.sandboxId,
        port: session.devPort ?? 3000,
        repoId: session.repoId,
        checkReady: true,
      });
      await dismissDaytonaWarning(data.url);
      setPreviewUrl(data.url);
    } catch {
      setPreviewUrl(null);
    }
  }

  useEffect(() => {
    void fetchPreviewUrl();
  }, [session?.sandboxId, session?.status, session?.repoId]);

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;

  const latestVariations = getLatestVariations(messagesList);

  const handleSandboxToggle = async (action: "start" | "stop") => {
    if (action === "start") {
      await startSandboxMutation({
        id: designSessionId,
      });
    } else {
      setIsStopPending(true);
      try {
        await stopSandboxMutation({ id: designSessionId });
        setPreviewUrl(null);
      } catch (error) {
        setIsStopPending(false);
        throw error;
      }
      setIsStopPending(false);
    }
  };

  const handleSelectVariation = (index: number) => {
    selectVariation({ id: designSessionId, variationIndex: index });
  };

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (session === null) {
    return (
      <EntityNotFound
        entityLabel="design session"
        backTo={`${basePath}/designs`}
      />
    );
  }

  const isArchived = session.archived === true;

  return (
    <ResizablePanelLayout
      leftPanel={(ctx) => (
        <DesignChatPanel
          designSessionId={designSessionId}
          title={session.title}
          isArchived={isArchived}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={
            isSandboxStarting || isSandboxStopping || isStopPending
          }
          isExecuting={lastAssistantHasNoContent}
          onSandboxToggle={handleSandboxToggle}
          repoId={session.repoId}
          previewCollapsed={ctx.rightPanelCollapsed}
          onTogglePreview={ctx.onToggleRightPanel}
        />
      )}
      rightPanel={
        <DesignPreviewPanel
          previewUrl={previewUrl}
          sandboxRunning={isSandboxActive}
          isArchived={isArchived}
          isExecuting={lastAssistantHasNoContent}
          latestVariations={latestVariations}
          selectedVariationIndex={session.selectedVariationIndex}
          isSandboxStarting={isSandboxStarting}
          onStartSandbox={() => handleSandboxToggle("start")}
          onSelectVariation={handleSelectVariation}
        />
      }
      leftDefaultSize="40%"
      leftMinWidthPx={280}
      rightMinWidthPx={300}
      storageKey="design-preview-collapsed"
    />
  );
}
