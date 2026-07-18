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
import { DiffsPanel } from "./DiffsPanel";
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
  /** PR URL for the Diffs tab; absent when no PR exists for this surface. */
  prUrl?: string;
  /** User-defined tabs for this app; expected pre-filtered to enabled ones. */
  customTabs?: ReadonlyArray<Doc<"appTabs">>;
  /** Sessions only — enables agent-browsing takeover overlay on the desktop surface. */
  sessionId?: Id<"sessions">;
  agentBrowsingAt?: number;
}

/**
 * Renders the standard sandbox tab slots (preview, terminal, editor, desktop,
 * diffs) as a fragment. Callers wrap this in their own flex container and may
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

  const previewRegion = (
    <div className="flex h-full min-h-0 flex-col">
      {activeTab === "preview" ? (
        <PreviewPaneTabs
          previewIds={previewIds}
          activeId={resolvedPreviewActive}
          onSelect={setPreviewActive}
          onClose={handleClosePreview}
        />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === "preview" && previewIds.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
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
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={activeTab === "preview" ? "h-full flex flex-col" : "hidden"}
      >
        <ConsoleDock
          storageKey={`conductor:${owner.kind}:${cacheKey}:console`}
          preview={previewRegion}
          renderConsole={(visible) =>
            consolePane ? (
              <TerminalPanel
                owner={owner}
                sandboxId={sandboxId}
                isActive={isActive}
                ptyInstanceId={consolePane.id}
                isForeground={activeTab === "preview" && visible}
                runDevCommandOnConnect
                devCommand={devCommand}
              />
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
        {activeTab === "terminal" ? (
          <TerminalPaneTabs
            termIds={userTermPanes.map((pane) => pane.id)}
            activeId={resolvedTermActive}
            onSelect={setTermActive}
            onClose={handleCloseTerminal}
          />
        ) : null}
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
          activeTab === "browser" || activeTab === "desktop"
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
        />
      </div>
      <div className={activeTab === "diffs" ? "h-full" : "hidden"}>
        <DiffsPanel prUrl={prUrl} repoId={repoId} />
      </div>
      {customTabs?.map((tab) => {
        const slug = slugifyAppTabName(tab.name);
        return (
          <div
            key={tab._id}
            className={activeTab === slug ? "h-full" : "hidden"}
          >
            {activeTab === slug ? (
              <CustomTabPanel
                name={tab.name}
                port={tab.port}
                sandboxId={sandboxId}
                isActive={isActive}
                repoId={repoId}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}
