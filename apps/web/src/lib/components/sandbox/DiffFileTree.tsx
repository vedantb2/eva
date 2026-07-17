"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import type { GitStatus, GitStatusEntry } from "@pierre/trees";
import { useThemeMode } from "@/lib/hooks/useThemeMode";

interface DiffFileTreeProps {
  /** Changed file paths, in diff order. */
  files: string[];
  /** Per-path git status, drives the tree's colour indicators. */
  statuses: Record<string, GitStatus>;
  /** Path highlighted on first render (restored from the URL). */
  initialSelectedPath: string | null;
  /**
   * Fired when a file row is clicked. Only leaf files reach here — directory
   * selections are filtered out because they are not in `files`.
   */
  onSelect: (path: string) => void;
}

/**
 * Maps HeroUI surface tokens onto the tree's themeable custom properties. They
 * inherit through the tree's shadow DOM and resolve to `rgb(var(--token))`, so
 * they re-resolve automatically when the `.dark` class toggles. `colorScheme`
 * (set per render below) pins the tree's `light-dark()` git-status and icon
 * colours to the app theme, since those key off `color-scheme`, not the class.
 * Typed via index signature so CSS custom properties are allowed.
 */
const treeThemeVars: CSSProperties & Record<`--${string}`, string> = {
  "--trees-bg-override": "rgb(var(--background))",
  "--trees-fg-override": "rgb(var(--foreground))",
  "--trees-fg-muted-override": "rgb(var(--muted-foreground))",
  "--trees-bg-muted-override": "rgb(var(--muted))",
  "--trees-border-color-override": "rgb(var(--border))",
  "--trees-accent-override": "rgb(var(--primary))",
  "--trees-focus-ring-color-override": "rgb(var(--ring))",
};

/**
 * Left-hand file tree for the Diffs tab. Renders the changed files as a
 * clickable, nested tree with git-status colours. The model is created once by
 * `useFileTree`, so `DiffsPanel` remounts this component (via `key`) when the
 * set of changed files changes.
 */
export function DiffFileTree({
  files,
  statuses,
  initialSelectedPath,
  onSelect,
}: DiffFileTreeProps) {
  const { resolvedTheme } = useThemeMode();

  const gitStatus = useMemo<GitStatusEntry[]>(
    () => files.map((path) => ({ path, status: statuses[path] ?? "modified" })),
    [files, statuses],
  );

  const { model } = useFileTree({
    paths: files,
    gitStatus,
    density: "compact",
    flattenEmptyDirectories: true,
    initialExpansion: "open",
    initialSelectedPaths: initialSelectedPath ? [initialSelectedPath] : [],
    // Fires for file and directory rows; ignore paths outside the changed set
    // (i.e. directories) so only real file clicks drive the diff view.
    onSelectionChange: (selectedPaths) => {
      const path = selectedPaths[0];
      if (path && files.includes(path)) onSelect(path);
    },
  });

  return (
    <FileTree
      model={model}
      style={{ ...treeThemeVars, colorScheme: resolvedTheme }}
      className="h-full w-full"
    />
  );
}
