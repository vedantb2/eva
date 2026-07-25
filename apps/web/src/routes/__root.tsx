import { lazy, Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { ChangelogDialog } from "@/lib/components/ChangelogDialog";
import { AppToaster } from "@/lib/components/AppToaster";

export interface RouterContext {
  isSignedIn: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/** Lazy so the agentation package stays out of the production bundle. */
const DevAgentation = import.meta.env.DEV
  ? lazy(() =>
      import("@/lib/components/DevAgentation").then((m) => ({
        default: m.DevAgentation,
      })),
    )
  : null;

function RootComponent() {
  return (
    <ClientProvider>
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
      <ChangelogDialog />
      <AppToaster />
      <Analytics />
      {DevAgentation ? (
        <Suspense fallback={null}>
          <DevAgentation />
        </Suspense>
      ) : null}
    </ClientProvider>
  );
}
