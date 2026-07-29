import type { ReactNode } from "react";
import { useMatches } from "@tanstack/react-router";
import { AuthGate } from "@/lib/components/ClientProvider";
import { FollowOverlay } from "@/lib/components/FollowOverlay";
import { Sidebar } from "@/lib/components/Sidebar";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";
import { FollowProvider } from "@/lib/contexts/FollowContext";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { PageTitleProvider } from "@/lib/contexts/PageTitleContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    appShell?: boolean;
  }
}

/**
 * Hoists the app chrome (sidebar, search, follow overlay, toasts) above the
 * router Outlet so it mounts once and persists across route transitions,
 * instead of remounting per top-level layout (_global vs _repo). Routes opt
 * in via `staticData: { appShell: true }` on their layout route.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const hasShell = useMatches({
    select: (matches) => matches.some((m) => m.staticData.appShell === true),
  });

  if (!hasShell) {
    return <>{children}</>;
  }

  return (
    <AuthGate>
      <div className="relative min-h-screen bg-app-shell">
        <SidebarProvider>
          <PageTitleProvider>
            <SearchProvider>
              <FollowProvider>
                <Sidebar />
                {children}
                <SpotlightSearch />
                <FollowOverlay />
                <NotificationToastStream />
              </FollowProvider>
            </SearchProvider>
          </PageTitleProvider>
        </SidebarProvider>
      </div>
    </AuthGate>
  );
}
