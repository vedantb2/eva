import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SetupBanner } from "@/lib/components/SetupBanner";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { RepoProvider, RepoGate } from "@/lib/contexts/RepoContext";
import { LiveCursors } from "@/lib/components/LiveCursors";
import { cn } from "@eva/ui";

export const Route = createFileRoute("/_repo/$owner/$repo")({
  component: RepoLayoutInner,
});

function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col overflow-hidden pt-14 lg:pt-0",
        // Default 20rem matches prior lg:pl-80 until localStorage hydrates.
        collapsed ? "lg:pl-16" : "lg:pl-[var(--eva-sidebar-width,20rem)]",
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
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
