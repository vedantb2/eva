import { createContext, useContext, useState, useCallback } from "react";
import type { RawFilePatch } from "../../preload/types";

interface DiffTab {
  id: string;
  filePath: string;
  staged: boolean;
  patch: string;
}

interface DiffTabContextValue {
  diffTabs: DiffTab[];
  activeDiffTabId: string | null;
  openDiffTab: (filePath: string, staged: boolean, repoPath: string) => void;
  closeDiffTab: (id: string) => void;
  focusDiffTab: (id: string) => void;
  clearActiveDiffTab: () => void;
  clearAllDiffTabs: () => void;
}

const DiffTabContext = createContext<DiffTabContextValue | null>(null);

function makeDiffTabId(filePath: string, staged: boolean): string {
  return `diff:${staged ? "staged" : "unstaged"}:${filePath}`;
}

export function DiffTabProvider({ children }: { children: React.ReactNode }) {
  const [diffTabs, setDiffTabs] = useState<DiffTab[]>([]);
  const [activeDiffTabId, setActiveDiffTabId] = useState<string | null>(null);

  const openDiffTab = useCallback(
    async (filePath: string, staged: boolean, repoPath: string) => {
      const id = makeDiffTabId(filePath, staged);

      const fetcher = staged
        ? window.electronAPI.gitDiffStaged
        : window.electronAPI.gitDiffUnstaged;
      const allDiffs: RawFilePatch[] = await fetcher(repoPath);
      const fileDiff = allDiffs.find((d) => d.path === filePath);
      const patch = fileDiff?.patch ?? "";

      setDiffTabs((prev) => {
        const existing = prev.find((t) => t.id === id);
        if (existing) {
          return prev.map((t) => (t.id === id ? { ...t, patch } : t));
        }
        return [...prev, { id, filePath, staged, patch }];
      });
      setActiveDiffTabId(id);
    },
    [],
  );

  const closeDiffTab = useCallback((id: string) => {
    setDiffTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveDiffTabId((prev) => (prev === id ? null : prev));
  }, []);

  const focusDiffTab = useCallback((id: string) => {
    setActiveDiffTabId(id);
  }, []);

  const clearActiveDiffTab = useCallback(() => {
    setActiveDiffTabId(null);
  }, []);

  const clearAllDiffTabs = useCallback(() => {
    setDiffTabs([]);
    setActiveDiffTabId(null);
  }, []);

  return (
    <DiffTabContext.Provider
      value={{
        diffTabs,
        activeDiffTabId,
        openDiffTab,
        closeDiffTab,
        focusDiffTab,
        clearActiveDiffTab,
        clearAllDiffTabs,
      }}
    >
      {children}
    </DiffTabContext.Provider>
  );
}

export function useDiffTabContext(): DiffTabContextValue {
  const ctx = useContext(DiffTabContext);
  if (ctx === null) {
    throw new Error("useDiffTabContext must be used within DiffTabProvider");
  }
  return ctx;
}
