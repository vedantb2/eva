import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export const Route = createFileRoute("/_repo")({
  component: RepoLayout,
});

function RepoLayout() {
  return (
    <ClientProvider>
      <div className="relative min-h-screen bg-app-shell">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent"
        />
        <div className="relative z-10">
          <Outlet />
        </div>
        <NotificationToastStream />
      </div>
    </ClientProvider>
  );
}
