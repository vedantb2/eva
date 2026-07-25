import { useLocalStorage } from "usehooks-ts";

/**
 * Persists which diff file paths the reviewer has marked Viewed for a given PR.
 * Keyed by `prUrl` so Reviews and session Review tabs share progress for the
 * same pull request. Cleared automatically when the PR URL changes.
 */
export function useDiffViewedFiles(prUrl: string | undefined): {
  viewedPaths: ReadonlyArray<string>;
  isViewed: (path: string) => boolean;
  setViewed: (path: string, viewed: boolean) => void;
} {
  const storageKey = prUrl
    ? `eva:pr-diff-viewed:${prUrl}`
    : "eva:pr-diff-viewed:none";

  const [viewedPaths, setViewedPaths] = useLocalStorage<string[]>(
    storageKey,
    [],
  );

  const isViewed = (path: string) => viewedPaths.includes(path);

  const setViewed = (path: string, viewed: boolean) => {
    setViewedPaths((current) => {
      if (viewed) {
        return current.includes(path) ? current : [...current, path];
      }
      return current.filter((entry) => entry !== path);
    });
  };

  return { viewedPaths, isViewed, setViewed };
}
