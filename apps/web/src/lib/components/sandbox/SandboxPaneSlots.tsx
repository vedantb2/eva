"use client";

import type { Id } from "@conductor/backend";
import { cn } from "@conductor/ui";
import type { SandboxTab } from "@/lib/search-params";
import { TerminalPanel } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import type { PtyOwner } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import { WebPreviewPanel } from "@/routes/_repo/$owner/$repo/sessions/WebPreviewPanel";
import { EditorPanel } from "@/routes/_repo/$owner/$repo/sessions/EditorPanel";
import { DesktopPanel } from "@/routes/_repo/$owner/$repo/sessions/DesktopPanel";
import { TerminalPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/TerminalPaneTabs";
import { PreviewPaneTabs } from "@/routes/_repo/$owner/$repo/sessions/_components/PreviewPaneTabs";
import type { SandboxPanesApi } from "./useSandboxPanes";
import type { SandboxPreviewApi } from "./useSandboxPreview";

interface SandboxPaneSlotsProps {
  activeTab: SandboxTab;
  panes: SandboxPanesApi;
  preview: SandboxPreviewApi;
  owner: PtyOwner;
  sandboxId: string | undefined;
  isActive: boolean;
  repoId: Id<"githubRepos">;
  /** sessionStorage cache namespace for editor / desktop URL caches. */
  cacheKey: string;
  devCommand?: string;
}

/**
 * Renders the four standard sandbox tab slots (preview, terminal, editor,
 * desktop) as a fragment. Callers wrap this in their own flex container and
 * may add their own slots alongside (e.g. session PRD slot).
 */
export function SandboxPaneSlots({
  activeTab,
  panes,
  preview,
  owner,
  sandboxId,
  isActive,
  repoId,
  cacheKey,
  devCommand,
}: SandboxPaneSlotsProps) {
  const {
    previewIds,
    termPanes,
    resolvedPreviewActive,
    resolvedTermActive,
    setPreviewActive,
    setTermActive,
    handleClosePreview,
    handleCloseTerminal,
  } = panes;

  return (
    <>
      <div
        className={activeTab === "preview" ? "h-full flex flex-col" : "hidden"}
      >
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
      <div className={activeTab === "editor" ? "h-full" : "hidden"}>
        <EditorPanel
          cacheKey={cacheKey}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
        />
      </div>
      <div
        className={activeTab === "terminal" ? "h-full flex flex-col" : "hidden"}
      >
        {activeTab === "terminal" ? (
          <TerminalPaneTabs
            termIds={termPanes.map((pane) => pane.id)}
            activeId={resolvedTermActive}
            onSelect={setTermActive}
            onClose={handleCloseTerminal}
          />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col">
          {termPanes.map((pane, index) => (
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
                runDevCommandOnConnect={index === 0}
                devCommand={devCommand}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={activeTab === "desktop" ? "h-full" : "hidden"}>
        <DesktopPanel
          cacheKey={cacheKey}
          sandboxId={sandboxId}
          isActive={isActive}
          repoId={repoId}
        />
      </div>
    </>
  );
}
