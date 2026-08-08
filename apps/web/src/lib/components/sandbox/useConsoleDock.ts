"use client";

import { useLocalStorage } from "usehooks-ts";

interface ConsoleDockState {
  expanded: boolean;
  previewPct: number;
}

const DEFAULT_STATE: ConsoleDockState = { expanded: false, previewPct: 60 };

export interface ConsoleDockApi {
  expanded: boolean;
  previewPct: number;
  toggle: () => void;
  expand: () => void;
  setPreviewPct: (previewPct: number) => void;
}

/** Persisted controller shared by the console dock, hotkey, and action palette. */
export function useConsoleDock(storageScope: string): ConsoleDockApi {
  const [state, setState] = useLocalStorage<ConsoleDockState>(
    `eva:${storageScope}:console`,
    DEFAULT_STATE,
  );

  const toggle = () => {
    setState((current) => ({ ...current, expanded: !current.expanded }));
  };
  const expand = () => {
    setState((current) => ({ ...current, expanded: true }));
  };
  const setPreviewPct = (previewPct: number) => {
    setState((current) => ({ ...current, previewPct }));
  };

  return {
    expanded: state.expanded,
    previewPct: state.previewPct,
    toggle,
    expand,
    setPreviewPct,
  };
}
