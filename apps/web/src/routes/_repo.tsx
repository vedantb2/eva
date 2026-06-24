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
        <Outlet />
        <NotificationToastStream />
      </div>
    </AuthGate>
  );
}
