import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { SessionChromeTabsBar } from "@/lib/components/sidebar/session-tabs/SessionChromeTabsBar";
import { useChromeSessionTabsActive } from "@/lib/components/sidebar/session-tabs/useChromeSessionTabs";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { RepoProvider, RepoGate } from "@/lib/contexts/RepoContext";
import { LiveCursors } from "@/lib/components/LiveCursors";
import { cn } from "@eva/ui";

export const Route = createFileRoute("/_repo/$owner/$repo")({
  component: RepoLayoutInner,
});

function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const { pathname } = useLocation();
  const chromeSessionTabs = useChromeSessionTabsActive(pathname);
  // Chrome tabs hide the sessions second column — pad for rail only.
  const railOnly = collapsed || chromeSessionTabs;

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col overflow-hidden pt-14 lg:pt-0",
        // Default 20rem matches prior lg:pl-80 until localStorage hydrates.
        railOnly ? "lg:pl-16" : "lg:pl-[var(--eva-sidebar-width,20rem)]",
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        {chromeSessionTabs ? (
          <SessionChromeTabsBar pathname={pathname} />
        ) : null}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function RepoLayoutInner() {
  const { owner, repo } = Route.useParams();

  return (
    <RepoProvider owner={owner} repoParam={repo}>
      <MainContent>
        <RepoGate>
          <SetupBanner />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </RepoGate>
      </MainContent>
      <LiveCursors />
    </RepoProvider>
  );
}
