"use client";

import { useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import { useLocalStorage } from "usehooks-ts";
import type { PtyOwner } from "@/routes/_repo/$owner/$repo/sessions/TerminalPanel";
import type { SandboxTab } from "@/lib/search-params";

export const MAX_TERMINAL_PANES = 8;
export const MAX_PREVIEW_PANES = 8;

interface PaneStorageState {
  ids: string[];
  activeId: string;
}

export interface SandboxPanesApi {
  previewIds: string[];
  termIds: string[];
  resolvedPreviewActive: string;
  resolvedTermActive: string;
  setPreviewActive: (id: string) => void;
  setTermActive: (id: string) => void;
  handleNewPreview: () => void;
  handleNewTerminal: () => void;
  handleClosePreview: (id: string) => void;
  handleCloseTerminal: (id: string) => Promise<void>;
  newPreviewDisabled: boolean;
  newTerminalDisabled: boolean;
}

interface UseSandboxPanesArgs {
  owner: PtyOwner;
  /**
   * Full localStorage namespace for pane state — e.g. `session:<id>` or
   * `task:<id>`. Final keys: `conductor:<storageScope>:previews` and
   * `conductor:<storageScope>:terminals`.
   */
  storageScope: string;
  isActive: boolean;
  activeTab: SandboxTab | null;
  setActiveTab: (tab: SandboxTab) => Promise<URLSearchParams>;
}

/**
 * Owns multi-pane preview/terminal state for a sandbox panel. Persists pane
 * lists in localStorage so navigating away and back restores the same set of
 * panes. Disconnects the underlying PTY when a terminal pane is closed.
 *
 * Shared by both the session sandbox panel and the quick-task sandbox panel.
 */
export function useSandboxPanes({
  owner,
  storageScope,
  isActive,
  activeTab,
  setActiveTab,
}: UseSandboxPanesArgs): SandboxPanesApi {
  const disconnectPtyAction = useAction(api.pty.disconnectPty);

  const [previewState, setPreviewState] = useLocalStorage<PaneStorageState>(
    `conductor:${storageScope}:previews`,
    { ids: [], activeId: "" },
  );
  const previewIds = previewState.ids;
  const previewActive = previewState.activeId;
  const setPreviewIds = useCallback(
    (ids: string[]) => {
      setPreviewState((current) => ({ ...current, ids }));
    },
    [setPreviewState],
  );
  const setPreviewActive = useCallback(
    (activeId: string) => {
      setPreviewState((current) => ({ ...current, activeId }));
    },
    [setPreviewState],
  );

  const [terminalState, setTerminalState] = useLocalStorage<PaneStorageState>(
    `conductor:${storageScope}:terminals`,
    { ids: [], activeId: "" },
  );
  const termIds = terminalState.ids;
  const termActive = terminalState.activeId;
  const setTermIds = useCallback(
    (ids: string[]) => {
      setTerminalState((current) => ({ ...current, ids }));
    },
    [setTerminalState],
  );
  const setTermActive = useCallback(
    (activeId: string) => {
      setTerminalState((current) => ({ ...current, activeId }));
    },
    [setTerminalState],
  );

  // Auto-create the first pane the moment its tab is opened.
  useEffect(() => {
    if (activeTab !== "terminal" || termIds.length > 0) return;
    const id = crypto.randomUUID();
    setTermIds([id]);
    setTermActive(id);
  }, [activeTab, termIds.length, setTermIds, setTermActive]);

  useEffect(() => {
    if (activeTab !== "preview" || previewIds.length > 0) return;
    const id = crypto.randomUUID();
    setPreviewIds([id]);
    setPreviewActive(id);
  }, [activeTab, previewIds.length, setPreviewIds, setPreviewActive]);

  // Reconcile active id if it points at a removed pane.
  useEffect(() => {
    if (termIds.length === 0) return;
    if (termActive && termIds.includes(termActive)) return;
    setTermActive(termIds[0]);
  }, [termIds, termActive, setTermActive]);

  useEffect(() => {
    if (previewIds.length === 0) return;
    if (previewActive && previewIds.includes(previewActive)) return;
    setPreviewActive(previewIds[0]);
  }, [previewIds, previewActive, setPreviewActive]);

  const resolvedTermActive =
    termIds.length > 0
      ? termActive && termIds.includes(termActive)
        ? termActive
        : termIds[0]
      : "";
  const resolvedPreviewActive =
    previewIds.length > 0
      ? previewActive && previewIds.includes(previewActive)
        ? previewActive
        : previewIds[0]
      : "";

  const handleNewPreview = useCallback(() => {
    if (!isActive || previewIds.length >= MAX_PREVIEW_PANES) return;
    const id = crypto.randomUUID();
    const next = previewIds.length === 0 ? [id] : [...previewIds, id];
    setPreviewIds(next);
    setPreviewActive(id);
    void setActiveTab("preview");
  }, [isActive, previewIds, setPreviewIds, setPreviewActive, setActiveTab]);

  const handleNewTerminal = useCallback(() => {
    if (!isActive || termIds.length >= MAX_TERMINAL_PANES) return;
    const id = crypto.randomUUID();
    const next = termIds.length === 0 ? [id] : [...termIds, id];
    setTermIds(next);
    setTermActive(id);
    void setActiveTab("terminal");
  }, [isActive, termIds, setTermIds, setTermActive, setActiveTab]);

  const handleCloseTerminal = useCallback(
    async (ptyId: string) => {
      if (termIds[0] === ptyId) return;
      const removedIdx = termIds.indexOf(ptyId);
      if (removedIdx < 0) return;
      const next = termIds.filter((t) => t !== ptyId);
      try {
        await disconnectPtyAction({ owner, ptyInstanceId: ptyId });
      } catch {
        // still remove from UI
      }
      setTermIds(next);
      if (termActive === ptyId) {
        const pick = next[removedIdx - 1] ?? next[0] ?? "";
        setTermActive(pick);
      }
    },
    [
      termIds,
      termActive,
      disconnectPtyAction,
      owner,
      setTermIds,
      setTermActive,
    ],
  );

  const handleClosePreview = useCallback(
    (previewId: string) => {
      if (previewIds[0] === previewId) return;
      const removedIdx = previewIds.indexOf(previewId);
      if (removedIdx < 0) return;
      const next = previewIds.filter((id) => id !== previewId);
      setPreviewIds(next);
      if (previewActive === previewId) {
        const pick = next[removedIdx - 1] ?? next[0] ?? "";
        setPreviewActive(pick);
      }
    },
    [previewIds, previewActive, setPreviewIds, setPreviewActive],
  );

  const newTerminalDisabled = !isActive || termIds.length >= MAX_TERMINAL_PANES;
  const newPreviewDisabled =
    !isActive || previewIds.length >= MAX_PREVIEW_PANES;

  return {
    previewIds,
    termIds,
    resolvedPreviewActive,
    resolvedTermActive,
    setPreviewActive,
    setTermActive,
    handleNewPreview,
    handleNewTerminal,
    handleClosePreview,
    handleCloseTerminal,
    newPreviewDisabled,
    newTerminalDisabled,
  };
}
