"use client";

import { Spinner } from "@conductor/ui";
import type { ReactNode } from "react";
import { EntityNotFound } from "@/lib/components/EntityNotFound";

export type EntityResolveStatus = "loading" | "not-found" | "ready";

export function EntityNumIdGate<TId extends string>({
  status,
  convexId,
  entityLabel,
  backTo,
  backLabel,
  children,
}: {
  status: EntityResolveStatus;
  convexId: TId | null;
  /** Singular label for not-found copy, e.g. "task", "session". */
  entityLabel: string;
  backTo?: string;
  backLabel?: string;
  children: (convexId: TId) => ReactNode;
}) {
  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "not-found" || convexId === null) {
    return (
      <EntityNotFound
        entityLabel={entityLabel}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }

  return children(convexId);
}
