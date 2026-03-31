import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthGate } from "@/lib/components/ClientProvider";
import { Sidebar } from "@/lib/components/Sidebar";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

export const Route = createFileRoute("/_global")({
  beforeLoad: ({ context }) => {
    if (!context.isSignedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: GlobalLayout,
});

function GlobalMainContent() {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`relative flex min-h-screen flex-col pt-14 transition-[padding] duration-300 lg:pt-0 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
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
        <Sidebar />
        <GlobalMainContent />
        <NotificationToastStream />
      </SidebarProvider>
    </AuthGate>
  );
}
