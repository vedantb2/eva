import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthGate } from "@/lib/components/ClientProvider";
import { NotificationToastStream } from "@/lib/components/NotificationToastStream";

export const Route = createFileRoute("/_repo")({
  beforeLoad: ({ context }) => {
    if (!context.isSignedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: RepoLayout,
});

function RepoLayout() {
  return (
    <AuthGate>
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
    </AuthGate>
  );
}
