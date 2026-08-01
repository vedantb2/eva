import { useRouterState } from "@tanstack/react-router";

/** Subscribes to URL search changes so preview dialogs react to client navigation. */
export function useDevPreviewSearchKey(): string {
  return useRouterState({
    select: (state) => state.location.searchStr,
  });
}

function isWelcomeSetupSearch(searchStr: string): boolean {
  const params = new URLSearchParams(searchStr);
  return params.has("welcome-setup") || params.get("welcomeSetup") === "true";
}

function isChangelogSearch(searchStr: string): boolean {
  const params = new URLSearchParams(searchStr);
  return params.has("changelog") || params.get("changelogPreview") === "true";
}

/** Dev-only: true when URL requests the welcome setup preview. */
export function useDevWelcomeSetupPreview(): boolean {
  const searchStr = useDevPreviewSearchKey();
  if (!import.meta.env.DEV) return false;
  return isWelcomeSetupSearch(searchStr);
}

/** Dev-only: true when URL requests the changelog dialog preview. */
export function useDevChangelogPreview(): boolean {
  const searchStr = useDevPreviewSearchKey();
  if (!import.meta.env.DEV) return false;
  return isChangelogSearch(searchStr);
}
