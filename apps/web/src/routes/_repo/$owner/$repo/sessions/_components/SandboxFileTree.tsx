import { useEffect } from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import { Button, cn } from "@eva/ui";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { treeThemeVars } from "@/lib/components/sandbox/treeTheme";

interface SandboxFileTreeProps {
  paths: string[];
  truncated: boolean;
  selectedPath: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectFile: (relPath: string) => void;
}

/**
 * Full-repo file tree for the session Files tab. Unlike DiffFileTree (diff-
 * specialised: gitStatus, expand-all), this is search-first with shallow
 * initial expansion. The model is created once by `useFileTree`; the parent
 * remounts via `key` when the file list content changes.
 */
export function SandboxFileTree({
  paths,
  truncated,
  selectedPath,
  isRefreshing,
  onRefresh,
  onSelectFile,
}: SandboxFileTreeProps) {
  const { resolvedTheme } = useThemeMode();

  const { model } = useFileTree({
    paths,
    density: "compact",
    flattenEmptyDirectories: true,
    initialExpansion: 1,
    search: true,
    fileTreeSearchMode: "hide-non-matches",
    initialSelectedPaths: selectedPath ? [selectedPath] : [],
    onSelectionChange: (selectedPaths) => {
      const path = selectedPaths[0];
      // Pierre directory IDs always end with `/`; list is files-only.
      if (path && !path.endsWith("/")) {
        onSelectFile(path);
      }
    },
  });

  // Keep highlight + scroll in sync when `?file=` changes while mounted
  // (chat chip). Re-setting the same path is a nuqs no-op — no loop.
  useEffect(() => {
    if (!selectedPath) return;
    const item = model.getItem(selectedPath);
    if (!item) return;
    if (!item.isSelected()) {
      item.select();
    }
    model.scrollToPath(selectedPath, { offset: "nearest" });
  }, [selectedPath, model]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {paths.length.toLocaleString()} files
          {truncated ? (
            <span
              className="text-muted-foreground"
              title="File list capped at 20,000 entries"
            >
              {" "}
              · partial
            </span>
          ) : null}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            model.openSearch();
          }}
          aria-label="Search files"
        >
          <IconSearch className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh file list"
        >
          <IconRefresh
            className={cn("size-3.5", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <FileTree
          model={model}
          style={{ ...treeThemeVars, colorScheme: resolvedTheme }}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
