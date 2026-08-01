import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";

export type PrDiffState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      diff: string;
      truncated: boolean;
      /** Commits the diff spans, for per-file full-content reads. */
      baseSha: string;
      headSha: string;
      /** `https://github.com/<owner>/<name>`. */
      repoUrl: string;
    };

/**
 * Loads a pull request's diff. `getPrDiff` is a Convex action (not a reactive
 * query), so the fetch is imperative; `refresh` re-runs it with the server-side
 * cache bypassed.
 */
export function usePrDiff(
  prUrl: string | undefined,
  repoId: Id<"githubRepos">,
): { state: PrDiffState; refresh: () => void } {
  const getPrDiff = useAction(api.github.getPrDiff);
  const [state, setState] = useState<PrDiffState>({ status: "loading" });
  // Bumped by Refresh to force the load effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!prUrl) return;
    let cancelled = false;
    setState({ status: "loading" });
    // reloadKey > 0 means Refresh — bypass ActionCache TTL.
    getPrDiff({ repoId, prUrl, force: reloadKey > 0 })
      .then((res) => {
        if (cancelled) return;
        setState({
          status: "ready",
          diff: res.diff,
          truncated: res.truncated,
          baseSha: res.baseSha,
          headSha: res.headSha,
          repoUrl: res.repoUrl,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [prUrl, repoId, reloadKey, getPrDiff]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return { state, refresh };
}
