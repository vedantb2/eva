"use client";

import { Navigate } from "@tanstack/react-router";
import {
  isSimpleViewHiddenSandboxTab,
  useSimpleView,
} from "@/lib/hooks/useSimpleView";
import { useMockAgentsRevealsTab } from "@/lib/components/sandbox/mockAgents";

type SimpleViewSandboxRedirectTo =
  | "/$owner/$repo/sessions/$numId/$sandboxTab"
  | "/$owner/$repo/projects/$numId/sandbox/$sandboxTab"
  | "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab";

interface SimpleViewSandboxRedirectProps {
  activeTab: string;
  to: SimpleViewSandboxRedirectTo;
  params: { owner: string; repo: string; numId: string };
}

/** Bounces sandbox URLs that simple view does not show to Preview. */
export function SimpleViewSandboxRedirect({
  activeTab,
  to,
  params,
}: SimpleViewSandboxRedirectProps) {
  const simpleView = useSimpleView();
  // `?mockAgents=1` demo: `/agents` must stick, or clicking the chat CTA row
  // lands on Preview a beat later. No effect without the param.
  const mockRevealsTab = useMockAgentsRevealsTab(activeTab);
  if (!simpleView || mockRevealsTab) return null;
  if (!isSimpleViewHiddenSandboxTab(activeTab)) return null;
  return (
    <Navigate
      to={to}
      params={{ ...params, sandboxTab: "preview" }}
      search={(prev) => prev}
      replace
    />
  );
}
