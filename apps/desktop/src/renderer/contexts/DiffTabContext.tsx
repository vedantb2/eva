import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { RawFilePatch } from "../../preload/types";

export interface AllDiffFileEntry {
  path: string;
  status: RawFilePatch["status"];
  staged: boolean;
  patch: string;
}

interface SingleFileDiffTab {
  kind: "single";
  id: string;
  filePath: string;
  staged: boolean;
  patch: string;
}

interface AllFilesDiffTab {
  kind: "all";
  id: string;
  patches: AllDiffFileEntry[];
}

export type DiffTab = SingleFileDiffTab | AllFilesDiffTab;

interface DiffTabDataValue {
  diffTabs: DiffTab[];
  activeDiffTabId: string | null;
}

interface DiffTabActionsValue {
  openDiffTab: (filePath: string, staged: boolean, repoPath: string) => void;
  openAllDiffsTab: (repoPath: string) => void;
  closeDiffTab: (id: string) => void;
  focusDiffTab: (id: string) => void;
  clearActiveDiffTab: () => void;
  clearAllDiffTabs: () => void;
}

const DiffTabDataContext = createContext<DiffTabDataValue | null>(null);
const DiffTabActionsContext = createContext<DiffTabActionsValue | null>(null);

function makeDiffTabId(filePath: string, staged: boolean): string {
  return `diff:${staged ? "staged" : "unstaged"}:${filePath}`;
}

const ALL_DIFFS_TAB_ID = "diff:all";

export function DiffTabProvider({ children }: { children: React.ReactNode }) {
  const [diffTabs, setDiffTabs] = useState<DiffTab[]>([]);
  const [activeDiffTabId, setActiveDiffTabId] = useState<string | null>(null);

  const openDiffTab = useCallback(
    async (filePath: string, staged: boolean, repoPath: string) => {
      const id = makeDiffTabId(filePath, staged);
      const patch = await window.electronAPI.gitDiffFile(
        repoPath,
        filePath,
        staged,
      );

      setDiffTabs((prev) => {
        const existing = prev.find((t) => t.id === id);
        if (existing) {
          return prev.map((t) =>
            t.id === id ? { kind: "single", id, filePath, staged, patch } : t,
          );
        }
        return [...prev, { kind: "single", id, filePath, staged, patch }];
      });
      setActiveDiffTabId(id);
    },
    [],
  );

  const openAllDiffsTab = useCallback(async (repoPath: string) => {
    const [stagedDiffs, unstagedDiffs] = await Promise.all([
      window.electronAPI.gitDiffStaged(repoPath),
      window.electronAPI.gitDiffUnstaged(repoPath),
    ]);

    const entries: AllDiffFileEntry[] = [
      ...stagedDiffs.map((d) => ({
        path: d.path,
        status: d.status,
        staged: true,
        patch: d.patch,
      })),
      ...unstagedDiffs.map((d) => ({
        path: d.path,
        status: d.status,
        staged: false,
        patch: d.patch,
      })),
    ];

    setDiffTabs((prev) => {
      const withoutAll = prev.filter((t) => t.id !== ALL_DIFFS_TAB_ID);
      return [
        ...withoutAll,
        { kind: "all", id: ALL_DIFFS_TAB_ID, patches: entries },
      ];
    });
    setActiveDiffTabId(ALL_DIFFS_TAB_ID);
  }, []);

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

  const dataValue = useMemo<DiffTabDataValue>(
    () => ({ diffTabs, activeDiffTabId }),
    [diffTabs, activeDiffTabId],
  );

  const actionsValue = useMemo<DiffTabActionsValue>(
    () => ({
      openDiffTab,
      openAllDiffsTab,
      closeDiffTab,
      focusDiffTab,
      clearActiveDiffTab,
      clearAllDiffTabs,
    }),
    [
      openDiffTab,
      openAllDiffsTab,
      closeDiffTab,
      focusDiffTab,
      clearActiveDiffTab,
      clearAllDiffTabs,
    ],
  );

  return (
    <DiffTabDataContext.Provider value={dataValue}>
      <DiffTabActionsContext.Provider value={actionsValue}>
        {children}
      </DiffTabActionsContext.Provider>
    </DiffTabDataContext.Provider>
  );
}

export function useDiffTabData(): DiffTabDataValue {
  const ctx = useContext(DiffTabDataContext);
  if (ctx === null) {
    throw new Error("useDiffTabData must be used within DiffTabProvider");
  }
  return ctx;
}

export function useDiffTabActions(): DiffTabActionsValue {
  const ctx = useContext(DiffTabActionsContext);
  if (ctx === null) {
    throw new Error("useDiffTabActions must be used within DiffTabProvider");
  }
  return ctx;
}

export function useDiffTabContext(): DiffTabDataValue & DiffTabActionsValue {
  return { ...useDiffTabData(), ...useDiffTabActions() };
}
