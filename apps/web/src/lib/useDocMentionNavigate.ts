"use client";

import { useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import { entityPathSegment } from "@/lib/numId";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

function docPathSegment(
  doc: { numId?: number } | null | undefined,
): string | null {
  if (!doc) {
    return null;
  }
  return entityPathSegment(doc);
}

/** Navigates to a doc detail URL using its per-repo numId. */
export function useDocMentionNavigate(repoBasePath: string) {
  const navigate = useNavigate();
  const convex = useConvex();

  return async (docId: Id<"docs">, knownDocs?: Array<Doc<"docs">>) => {
    const cached = knownDocs?.find((doc) => doc._id === docId);
    const cachedSegment = docPathSegment(cached);
    if (cachedSegment) {
      navigate({
        to: `${repoBasePath}/docs/${cachedSegment}/${DOC_VIEWER_DEFAULT_TAB}`,
      });
      return;
    }

    const doc = await convex.query(api.docs.get, { id: docId });
    const segment = docPathSegment(doc);
    if (!segment) {
      return;
    }
    navigate({
      to: `${repoBasePath}/docs/${segment}/${DOC_VIEWER_DEFAULT_TAB}`,
    });
  };
}
