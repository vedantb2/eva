import type { ReactNode } from "react";
import { useIdleReady } from "@/lib/hooks/useIdleReady";

/** Renders children only after `requestIdleCallback` (see `useIdleReady`). */
export function DeferredAfterIdle({
  children,
  timeoutMs = 2000,
}: {
  children: ReactNode;
  timeoutMs?: number;
}) {
  const ready = useIdleReady(timeoutMs);
  if (!ready) return null;
  return children;
}
