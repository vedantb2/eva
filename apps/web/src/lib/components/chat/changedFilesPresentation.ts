import type { ChangedFile } from "@/lib/components/chat/ChangedFilesCard";

export const CHANGED_FILES_AUTO_EXPAND_LIMIT = 5;
export const CHANGED_FILES_PREVIEW_LIMIT = 3;

function topLevelScope(path: string): string {
  const normalized = path
    .replace(/^\/tmp\/repo\//, "")
    .replace(/^\/workspace\/repo\//, "")
    .replaceAll("\\", "/");
  return normalized.split("/").find((segment) => segment.length > 0) ?? "";
}

export function shouldAutoExpandChangedFiles(
  files: ReadonlyArray<ChangedFile>,
  isLatestAssistantTurn: boolean,
): boolean {
  return (
    isLatestAssistantTurn && files.length <= CHANGED_FILES_AUTO_EXPAND_LIMIT
  );
}

export function shouldPreviewChangedFiles(
  files: ReadonlyArray<ChangedFile>,
  isLatestAssistantTurn: boolean,
): boolean {
  return (
    isLatestAssistantTurn && files.length > CHANGED_FILES_AUTO_EXPAND_LIMIT
  );
}

export function selectChangedFilePreview(
  files: ReadonlyArray<ChangedFile>,
  limit = CHANGED_FILES_PREVIEW_LIMIT,
): ChangedFile[] {
  const selected: ChangedFile[] = [];
  const selectedPaths = new Set<string>();
  const selectedScopes = new Set<string>();

  for (const file of files) {
    const scope = topLevelScope(file.path);
    if (selectedScopes.has(scope)) continue;
    selected.push(file);
    selectedPaths.add(file.path);
    selectedScopes.add(scope);
    if (selected.length === limit) return selected;
  }

  for (const file of files) {
    if (selectedPaths.has(file.path)) continue;
    selected.push(file);
    if (selected.length === limit) break;
  }

  return selected;
}
