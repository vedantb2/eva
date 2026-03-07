"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
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

  const [isSandboxStarting, setIsSandboxStarting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sandboxRunning = !!session?.sandboxId;

  useEffect(() => {
    if (isSandboxStarting && session?.sandboxId) {
      setIsSandboxStarting(false);
    }
  }, [isSandboxStarting, session?.sandboxId]);

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

  const handleStartSandbox = async () => {
    setIsSandboxStarting(true);
    try {
      await startSandboxMutation({
        id: designSessionId,
        installationId: repo.installationId,
      });
    } catch {
      setIsSandboxStarting(false);
    }
  };

  const handleStopSandbox = async () => {
    await stopSandboxMutation({ id: designSessionId });
    setPreviewUrl(null);
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
    <div className="flex h-full">
      <DesignChatPanel
        designSessionId={designSessionId}
        title={session.title}
        isArchived={isArchived}
        sandboxRunning={sandboxRunning}
        isSandboxStarting={isSandboxStarting}
        isExecuting={lastAssistantHasNoContent}
        onStartSandbox={handleStartSandbox}
        onStopSandbox={handleStopSandbox}
        repoId={session.repoId}
      />
      <DesignPreviewPanel
        previewUrl={previewUrl}
        sandboxRunning={sandboxRunning}
        isArchived={isArchived}
        isExecuting={lastAssistantHasNoContent}
        latestVariations={latestVariations}
        selectedVariationIndex={session.selectedVariationIndex}
        isSandboxStarting={isSandboxStarting}
        onStartSandbox={handleStartSandbox}
        onSelectVariation={handleSelectVariation}
      />
    </div>
  );
}
