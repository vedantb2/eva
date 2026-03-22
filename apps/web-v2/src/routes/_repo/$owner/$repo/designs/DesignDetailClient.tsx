import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { dismissDaytonaWarning } from "@/lib/utils/dismissDaytonaWarning";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
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
  const { repo } = useRepo();
  const selectVariation = useMutation(api.designSessions.selectVariation);
  const startSandboxMutation = useMutation(api.designSessions.startSandbox);
  const stopSandboxMutation = useMutation(api.designSessions.stopSandbox);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const [isStopPending, setIsStopPending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isSandboxStarting = session?.status === "starting";
  const isSandboxActive = session?.status === "active";

  const fetchPreviewUrl = useCallback(async () => {
    if (!session?.sandboxId) {
      setPreviewUrl(null);
      return;
    }
    try {
      const data = await getPreviewUrl({
        sandboxId: session.sandboxId,
        port: session.devPort ?? 3000,
        repoId: session.repoId,
      });
      await dismissDaytonaWarning(data.url);
      setPreviewUrl(data.url);
    } catch {
      setPreviewUrl(null);
    }
  }, [session?.sandboxId, getPreviewUrl, session?.repoId]);

  useEffect(() => {
    fetchPreviewUrl();
  }, [fetchPreviewUrl]);

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;

  const latestVariations = useMemo(
    () => getLatestVariations(messagesList),
    [messagesList],
  );

  const handleSandboxToggle = async (action: "start" | "stop") => {
    if (action === "start") {
      await startSandboxMutation({
        id: designSessionId,
        installationId: repo.installationId,
      });
    } else {
      setIsStopPending(true);
      try {
        await stopSandboxMutation({ id: designSessionId });
        setPreviewUrl(null);
      } finally {
        setIsStopPending(false);
      }
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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Design session not found</p>
      </div>
    );
  }

  const isArchived = session.archived === true;

  return (
    <ResizablePanelLayout
      leftPanel={() => (
        <DesignChatPanel
          designSessionId={designSessionId}
          title={session.title}
          isArchived={isArchived}
          isSandboxActive={isSandboxActive}
          isSandboxToggling={isSandboxStarting || isStopPending}
          isExecuting={lastAssistantHasNoContent}
          onSandboxToggle={handleSandboxToggle}
          repoId={session.repoId}
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
      collapseCookieName="design-preview-collapsed"
    />
  );
}
