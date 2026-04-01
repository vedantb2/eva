import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";

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
      <Analytics />
    </ClientProvider>
  );
}
