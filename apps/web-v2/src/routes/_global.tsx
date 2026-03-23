import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { TopNavBar } from "@/lib/components/TopNavBar";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export const Route = createFileRoute("/_global")({
  component: GlobalLayout,
});

function GlobalLayout() {
  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        <TopNavBar />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
        <NotificationToastStream />
      </div>
    </ClientProvider>
  );
}
