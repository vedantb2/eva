"use client";

import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { DiffView } from "@/lib/search-params";

/**
 * Diffs tab file/view selection via TanStack search params.
 *
 * Do not use nuqs here: its TanStack adapter does
 * `navigate({ to: pathname + '?diffFile=…' })`, and TanStack's resolvePath
 * treats the `?…` as part of `$sandboxTab`, which quick-tasks/projects then
 * reject and redirect to preview.
 */
export function useDiffSearchParams() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  const diffFileValue = "diffFile" in search ? search.diffFile : undefined;
  const diffFile = typeof diffFileValue === "string" ? diffFileValue : "";

  const diffViewValue = "diffView" in search ? search.diffView : undefined;
  const diffView: DiffView =
    diffViewValue === "split" || diffViewValue === "unified"
      ? diffViewValue
      : "unified";

  const setDiffFile = useCallback(
    (path: string) => {
      // `to: "."` keeps current path and loosens search typing for a hook used
      // across quick-tasks / projects / sessions (see TanStack search-params guide).
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, diffFile: path }),
        replace: true,
      });
    },
    [navigate],
  );

  const setDiffView = useCallback(
    (view: DiffView) => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, diffView: view }),
      });
    },
    [navigate],
  );

  return { diffFile, diffView, setDiffFile, setDiffView };
}
