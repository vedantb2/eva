"use client";

import type { Doc, Id } from "@conductor/backend";
import { cn } from "@conductor/ui";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { CustomTabPanel } from "./CustomTabPanel";
import { TerminalPanel } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import type { PtyOwner } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import { WebPreviewPanel } from "@/routes/_repo/$owner/$repo/sessions/WebPreviewPanel";
import { EditorPanel } from "@/routes/_repo/$owner/$repo/sessions/EditorPanel";
import { DesktopPanel } from "@/routes/_repo/$owner/$repo/sessions/DesktopPanel";
import { PrPanel } from "./PrPanel";
import { TerminalPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/TerminalPaneTabs";
import { PreviewPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/PreviewPaneTabs";
import { ConsoleDock } from "./ConsoleDock";
import type { SandboxPanesApi } from "./useSandboxPanes";
import type { SandboxPreviewApi } from "./useSandboxPreview";

interface SandboxPaneSlotsProps {
  /** Builtin tab id (SandboxTab) or a custom tab's name slug. */
  activeTab: string;
  panes: SandboxPanesApi;
  preview: SandboxPreviewApi;
  owner: PtyOwner;
  sandboxId: string | undefined;
  /** Vercel sandbox name; when set, the Daytona preview hint is hidden. */
  vercelSandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  /** sessionStorage cache namespace for editor / desktop URL caches. */
  cacheKey: string;
  devCommand?: string;
  /** PR URL for the PR tab; absent when no PR exists for this surface. */
  prUrl?: string;
  /** User-defined tabs for this app; expected pre-filtered to enabled ones. */
  customTabs?: ReadonlyArray<Doc<"appTabs">>;
  /** Sessions only — enables agent-browsing takeover overlay on the desktop surface. */
  sessionId?: Id<"sessions">;
  agentBrowsingAt?: number;
  /**
   * When false, the Preview Console does not auto-type the start command
   * (session sandboxes start it in tmux from the backend after startup).
   * Defaults to true for tasks/projects.
   */
  runConsoleDevCommandOnConnect?: boolean;
  /** Computer/Browser desktop starting or running — gates Computer tab close. */
  onComputerRunningChange?: (running: boolean) => void;
  /** Preview empty state Start button when sandbox is stopped. */
  onStartSandbox?: () => void;
  isSandboxStarting?: boolean;
  /** Session-only: preview select-element → chat submit. */
  onAnnotationSubmit?: (display: string, full: string) => Promise<void>;
  /** Session sticky Preview path from Convex. */
  stickyPreviewPath?: string;
  onStickyPreviewPathChange?: (path: string) => void;
  /**
   * Session sticky console history: seed + debounced persist of last ~500 lines.
   * Only wired for the Preview Console pane.
   */
  stickyTerminalHistoryTail?: string;
  onStickyTerminalHistoryTailChange?: (tail: string) => void;
}

/**
 * Renders the standard sandbox tab slots (preview, terminal, editor, desktop,
 * Review) as a fragment. Callers wrap this in their own flex container and may
 * add their own slots alongside (e.g. session PRD slot).
 */
export function SandboxPaneSlots({
  activeTab,
  panes,
  preview,
  owner,
  sandboxId,
  vercelSandboxId,
  isActive,
  repoId,
  cacheKey,
  devCommand,
  prUrl,
  customTabs,
  sessionId,
  agentBrowsingAt,
  runConsoleDevCommandOnConnect = true,
  onComputerRunningChange,
  onStartSandbox,
  isSandboxStarting,
  onAnnotationSubmit,
  stickyPreviewPath,
  onStickyPreviewPathChange,
  stickyTerminalHistoryTail,
  onStickyTerminalHistoryTailChange,
}: SandboxPaneSlotsProps) {
  const {
    previewIds,
    consolePane,
    userTermPanes,
    resolvedPreviewActive,
    resolvedTermActive,
    setPreviewActive,
    setTermActive,
    handleClosePreview,
    handleCloseTerminal,
  } = panes;

  // Keep Preview chrome + iframes mounted while the Preview tab is hidden so
  // switching away (Editor / Review / …) does not remount the running app.
  const previewRegion = (
    <div className="flex h-full min-h-0 flex-col">
      <div className={activeTab === "preview" ? undefined : "hidden"}>
        <PreviewPaneTabs
          previewIds={previewIds}
          activeId={resolvedPreviewActive}
          onSelect={setPreviewActive}
          onClose={handleClosePreview}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {previewIds.length === 0 ? (
          <div
            className={
              activeTab === "preview"
                ? "flex flex-1 items-center justify-center text-sm text-muted-foreground"
                : "hidden"
            }
          >
            Preparing preview...
          </div>
        ) : null}
        {previewIds.map((id) => (
          <div
            key={id}
            className={cn(
              resolvedPreviewActive === id
                ? "flex min-h-0 flex-1 flex-col"
                : "hidden",
            )}
          >
            <WebPreviewPanel
              isActive={isActive}
              sandboxId={sandboxId}
              vercelSandboxId={vercelSandboxId}
              previewInfo={preview.previewInfo}
              isLoading={preview.isLoading}
              error={preview.error}
              iframeKey={preview.iframeKey}
              onRefresh={preview.fetchPreview}
              port={preview.effectivePort}
              onPortChange={preview.setPort}
              pathStorageKey={[
                "conductor",
                owner.kind,
                cacheKey,
                "preview-path",
                id,
                preview.effectivePort,
              ].join(":")}
              stickyPath={stickyPreviewPath}
              onStickyPathChange={onStickyPreviewPathChange}
              onStartSandbox={onStartSandbox}
              isSandboxStarting={isSandboxStarting}
              onAnnotationSubmit={onAnnotationSubmit}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={
          activeTab === "preview"
            ? "flex h-full min-h-0 flex-col overflow-hidden"
            : "hidden"
        }
      >
        <ConsoleDock
          storageKey={`conductor:${owner.kind}:${cacheKey}:console`}
          preview={previewRegion}
          renderConsole={(visible) =>
            consolePane ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <TerminalPanel
                  owner={owner}
                  sandboxId={sandboxId}
                  isActive={isActive}
                  ptyInstanceId={consolePane.id}
                  isForeground={activeTab === "preview" && visible}
                  runDevCommandOnConnect={runConsoleDevCommandOnConnect}
                  devCommand={devCommand}
                  stickyHistoryTail={stickyTerminalHistoryTail}
                  onStickyHistoryTailChange={onStickyTerminalHistoryTailChange}
                />
              </div>
            ) : null
          }
        />
      </div>
      <div className={activeTab === "editor" ? "h-full" : "hidden"}>
        <EditorPanel
          cacheKey={cacheKey}
          sandboxId={sandboxId}
          vercelSandboxId={vercelSandboxId}
          isActive={isActive}
          repoId={repoId}
        />
      </div>
      <div
        className={activeTab === "terminal" ? "h-full flex flex-col" : "hidden"}
      >
        <div className={activeTab === "terminal" ? undefined : "hidden"}>
          <TerminalPaneTabs
            termIds={userTermPanes.map((pane) => pane.id)}
            activeId={resolvedTermActive}
            onSelect={setTermActive}
            onClose={handleCloseTerminal}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          {userTermPanes.map((pane) => (
            <div
              key={pane.id}
              className={cn(
                resolvedTermActive === pane.id
                  ? "flex min-h-0 flex-1 flex-col"
                  : "hidden",
              )}
            >
              <TerminalPanel
                owner={owner}
                sandboxId={sandboxId}
                isActive={isActive}
                ptyInstanceId={pane.id}
                isForeground={
                  resolvedTermActive === pane.id && activeTab === "terminal"
                }
                runDevCommandOnConnect={false}
                devCommand={devCommand}
              />
            </div>
          ))}
        </div>
      </div>
      <div
        className={
          activeTab === "browser" || activeTab === "computer"
            ? "h-full"
            : "hidden"
        }
      >
        <DesktopPanel
          cacheKey={cacheKey}
          sandboxId={sandboxId}
          vercelSandboxId={vercelSandboxId}
          isActive={isActive}
          repoId={repoId}
          surface={activeTab === "browser" ? "browser" : "desktop"}
          sessionId={sessionId}
          agentBrowsingAt={agentBrowsingAt}
          onRunningChange={onComputerRunningChange}
        />
      </div>
      <div className={activeTab === "review" ? "h-full" : "hidden"}>
        <PrPanel
          prUrl={prUrl}
          repoId={repoId}
          isActive={activeTab === "review"}
        />
      </div>
      {customTabs?.map((tab) => {
        const slug = slugifyAppTabName(tab.name);
        return (
          <div
            key={tab._id}
            className={activeTab === slug ? "h-full" : "hidden"}
          >
            <CustomTabPanel
              name={tab.name}
              port={tab.port}
              sandboxId={sandboxId}
              isActive={isActive}
              isForeground={activeTab === slug}
              repoId={repoId}
            />
          </div>
        );
      })}
    </>
  );
}
