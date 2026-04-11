import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { ChangelogDialog } from "@/lib/components/ChangelogDialog";

export interface RouterContext {
  isSignedIn: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ClientProvider>
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
      <ChangelogDialog />
      <Analytics />
    </ClientProvider>
  );
}
