import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { AuthGate } from "@/lib/components/ClientProvider";
import { FollowOverlay } from "@/lib/components/FollowOverlay";
import { Sidebar } from "@/lib/components/Sidebar";
import { SpotlightSearch } from "@/lib/components/SpotlightSearch";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";
import { FollowProvider } from "@/lib/contexts/FollowContext";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { PageTitleProvider } from "@/lib/contexts/PageTitleContext";
import { SearchProvider } from "@/lib/contexts/SearchContext";
import { cn } from "@conductor/ui";

export const Route = createFileRoute("/_global")({
  beforeLoad: ({ context }) => {
    if (!context.isSignedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: GlobalLayout,
});

function GlobalMainContent() {
  const { pathname } = useLocation();
  const { collapsed } = useSidebar();
  const isSessionsLanding =
    pathname === "/sessions" || pathname === "/sessions/";
  // Sessions landing shows the wide second column; collapsed hides it (rail only).
  const paddingClass = isSessionsLanding
    ? collapsed
      ? "lg:pl-16"
      : "lg:pl-[var(--eva-sidebar-width,20rem)]"
    : "lg:pl-16";

  return (
    <div
      className={cn(
        // No padding transition: animating pl-* during route changes counts as CLS.
        "relative flex min-h-screen flex-col pt-14 lg:pt-0",
        paddingClass,
      )}
    >
      <div className="relative flex flex-1 flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function GlobalLayout() {
  return (
    <AuthGate>
      <SidebarProvider>
        <PageTitleProvider>
          <SearchProvider>
            <FollowProvider>
              <Sidebar />
              <GlobalMainContent />
              <SpotlightSearch />
              <FollowOverlay />
              <NotificationToastStream />
            </FollowProvider>
          </SearchProvider>
        </PageTitleProvider>
      </SidebarProvider>
    </AuthGate>
  );
}
