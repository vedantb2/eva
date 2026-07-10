"use client";

import { Spinner } from "@conductor/ui";
import type { ReactNode } from "react";

export type EntityResolveStatus = "loading" | "not-found" | "ready";

export function EntityNumIdGate({
  status,
  convexId,
  children,
}: {
  status: EntityResolveStatus;
  convexId: string | null;
  children: (convexId: string) => ReactNode;
}) {
  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "not-found" || convexId === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  return children(convexId);
}
