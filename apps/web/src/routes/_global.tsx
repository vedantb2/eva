import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthGate } from "@/lib/components/ClientProvider";
import { FollowOverlay } from "@/lib/components/FollowOverlay";
import { Sidebar } from "@/lib/components/Sidebar";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";
import { FollowProvider } from "@/lib/contexts/FollowContext";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { PageTitleProvider } from "@/lib/contexts/PageTitleContext";

export const Route = createFileRoute("/_global")({
  beforeLoad: ({ context }) => {
    if (!context.isSignedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: GlobalLayout,
});

function GlobalMainContent() {
  // Global pages are rail-only (w-16); the wider repo sidebar never mounts here.
  return (
    <div className="relative flex min-h-screen flex-col pt-14 lg:pt-0 lg:pl-16">
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
          <FollowProvider>
            <Sidebar />
            <GlobalMainContent />
            <FollowOverlay />
            <NotificationToastStream />
          </FollowProvider>
        </PageTitleProvider>
      </SidebarProvider>
    </AuthGate>
  );
}
