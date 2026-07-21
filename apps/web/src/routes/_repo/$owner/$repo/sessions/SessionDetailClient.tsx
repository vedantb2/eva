import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { SandboxPanel } from "./SandboxPanel";
import { Spinner } from "@conductor/ui";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PendingReviewCommentsProvider } from "@/lib/contexts/PendingReviewCommentsContext";
import { isSessionPrReadOnly } from "./_utils/sessionReadOnly";

export function SessionDetailClient({
  sessionId,
  activeSandboxTab,
  onSandboxTabChange,
  onOpenFile,
  onViewDiff,
}: {
  sessionId: Id<"sessions">;
  /** Builtin tab id (SandboxTab) or a custom tab's name slug. */
  activeSandboxTab: string;
  onSandboxTabChange: (tab: string) => void;
  /** Opens a file (by full sandbox path) in the File Viewer tab. */
  onOpenFile: (path: string) => void;
  /** Opens the PR tab (Diffs sub-tab); optional repo-relative path scrolls to that file. */
  onViewDiff?: (repoRelativePath?: string) => void;
}) {
  const { basePath, repo } = useRepo();
  const session = useQuery(api.sessions.get, { id: sessionId });
  const messages = useQuery(api.messages.listByParent, {
    parentId: sessionId,
  });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: sessionId,
  });
  const streaming = useQuery(api.streaming.get, { entityId: sessionId });
  const summaryStreaming = useQuery(api.streaming.get, {
    entityId: `summary:${sessionId}`,
  });
  const startupStreaming = useQuery(api.streaming.get, {
    entityId: `session-startup-${sessionId}`,
  });
  const startSandboxMutation = useMutation(api.sessions.startSandbox);
  const stopSandboxMutation = useMutation(api.sessions.stopSandbox);

  // Pre-warm the Claude daemon as soon as the session opens (once its sandbox is
  // known), so the user's first message is warm instead of paying a ~20s cold
  // respawn. Idempotent server-side (skips if a daemon is already alive), so
  // re-firing when the sandbox id resolves is cheap.
  const prewarmDaemon = useMutation(api.sessionWorkflow.prewarmDaemon);
  const sandboxId = session?.sandboxId;
  // A closed/stopping session keeps its sandboxId, so gate on status too:
  // prewarming resumes the stopped Vercel VM (server-side no-op now, but this
  // avoids the pointless round-trip on every closed-session page open).
  const sandboxStatus = session?.status;
  useEffect(() => {
    if (!sandboxId) return;
    if (sandboxStatus === "closed" || sandboxStatus === "stopping") return;
    void prewarmDaemon({ sessionId });
  }, [sessionId, sandboxId, sandboxStatus, prewarmDaemon]);
  const isSandboxStarting = session?.status === "starting";
  // `stopping` is a transient backend state set synchronously by `stopSandbox`,
  // cleared once Daytona's stop call completes (~10s). Showing the spinner
  // (and disabling Start) for its full duration prevents the stop/start race
  // that previously orphaned sandboxes.
  const isSandboxStopping = session?.status === "stopping";
  const [isStopPending, setIsStopPending] = useState(false);
  const handleSandboxToggle = async (action: "start" | "stop") => {
    if (action === "start") {
      await startSandboxMutation({
        sessionId,
      });
    } else {
      setIsStopPending(true);
      try {
        await stopSandboxMutation({ sessionId });
      } finally {
        setIsStopPending(false);
      }
    }
  };

  // Must stay above loading/null early returns — Phase 3 review comments
  // introduced this hook after them and tripped React #310 on session resolve.
  const openDiffsTab = () => {
    if (onViewDiff) {
      onViewDiff();
      return;
    }
    onSandboxTabChange("pr");
  };

  // Auto-switch to Browser + expand sandbox panel on lock transition only
  // (undefined → set). Don't fight the user if they switch away mid-lock.
  const prevAgentBrowsingAt = useRef<number | undefined>(undefined);
  const [expandRightSignal, setExpandRightSignal] = useState(0);
  const agentBrowsingAt =
    session === null || session === undefined
      ? undefined
      : session.agentBrowsingAt;
  useEffect(() => {
    const prev = prevAgentBrowsingAt.current;
    prevAgentBrowsingAt.current = agentBrowsingAt;
    if (agentBrowsingAt === undefined || prev !== undefined) return;
    onSandboxTabChange("browser");
    setExpandRightSignal((n) => n + 1);
  }, [agentBrowsingAt, onSandboxTabChange]);

  if (session === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (session === null) {
    return (
      <EntityNotFound entityLabel="session" backTo={`${basePath}/sessions`} />
    );
  }

  const isSandboxActive = session.status === "active";
  const isArchived = session.archived === true;
  // Archive + PR terminal states share the same UI gates; PR reopen clears lock.
  const isReadOnly = isArchived || isSessionPrReadOnly(session.prState);

  return (
    <PendingReviewCommentsProvider onOpenDiffsTab={openDiffsTab}>
      <ResizablePanelLayout
        leftPanel={({ rightPanelCollapsed, onToggleRightPanel }) => (
          <ChatPanel
            sessionId={sessionId}
            title={session.title}
            branchName={session.branchName}
            prUrl={session.prUrl}
            prState={session.prState}
            summary={session.summary}
            messages={messages ?? []}
            queuedMessages={queuedMessages ?? []}
            planContent={session.planContent}
            streamingActivity={streaming?.currentActivity}
            streamingContent={streaming?.currentContent}
            streamingPendingQuestion={streaming?.pendingQuestion}
            summaryStreamingActivity={summaryStreaming?.currentActivity}
            startupStreamingActivity={startupStreaming?.currentActivity}
            isSandboxActive={isSandboxActive}
            isSandboxToggling={
              isSandboxStarting || isSandboxStopping || isStopPending
            }
            isSandboxStopping={isSandboxStopping || isStopPending}
            onSandboxToggle={handleSandboxToggle}
            isArchived={isArchived}
            isReadOnly={isReadOnly}
            deploymentStatus={session.deploymentStatus}
            sandboxCollapsed={rightPanelCollapsed}
            onToggleSandbox={onToggleRightPanel}
            onOpenFile={onOpenFile}
            onViewDiff={onViewDiff}
            onOpenPrdTab={() => {
              onSandboxTabChange("prd");
              setExpandRightSignal((n) => n + 1);
            }}
          />
        )}
        rightPanel={
          <SandboxPanel
            sessionId={sessionId}
            sandboxId={session.sandboxId}
            vercelSandboxId={session.vercelSandboxId}
            isActive={isSandboxActive}
            repoId={session.repoId}
            prUrl={session.prUrl}
            // Prefer session (set after services start); fall back to app
            // settings so preview doesn't default to 3000 before that lands.
            devPort={session.devPort ?? repo.devPort}
            devCommand={session.devCommand ?? repo.devCommand}
            terminalPanes={session.terminalPanes}
            planContent={session.planContent}
            isArchived={isReadOnly}
            activeTab={activeSandboxTab}
            onTabChange={onSandboxTabChange}
            agentBrowsingAt={session.agentBrowsingAt}
            onStartSandbox={
              isReadOnly || isSandboxStopping || isStopPending
                ? undefined
                : () => {
                    void handleSandboxToggle("start");
                  }
            }
            isSandboxStarting={isSandboxStarting}
          />
        }
        leftDefaultSize="30%"
        leftMinWidthPx={350}
        rightMinWidthPx={300}
        storageKey="sandbox-collapsed"
        expandRightSignal={expandRightSignal}
      />
    </PendingReviewCommentsProvider>
  );
}
