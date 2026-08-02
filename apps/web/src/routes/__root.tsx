import { lazy, Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { AppToaster } from "@/lib/components/AppToaster";
import { AppShell } from "@/lib/components/AppShell";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

export interface RouterContext {
  isSignedIn: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/** Lazy: streamdown + cjk/math/mermaid (katex) off the critical path. */
const ChangelogDialog = lazy(() =>
  import("@/lib/components/ChangelogDialog").then((m) => ({
    default: m.ChangelogDialog,
  })),
);

/** Lazy so the agentation package stays out of the production bundle. */
const DevAgentation = import.meta.env.DEV
  ? lazy(() =>
      import("@/lib/components/DevAgentation").then((m) => ({
        default: m.DevAgentation,
      })),
    )
  : null;

function RootComponent() {
  useDocumentTitle();

  return (
    <ClientProvider>
      <NuqsAdapter>
        <AppShell>
          <Outlet />
        </AppShell>
      </NuqsAdapter>
      <Suspense fallback={null}>
        <ChangelogDialog />
      </Suspense>
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
