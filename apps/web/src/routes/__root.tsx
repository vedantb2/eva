import { lazy, Suspense } from "react";
import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { AppToaster } from "@/lib/components/AppToaster";
import { AppShell } from "@/lib/components/AppShell";
import { PreviewIframeHost } from "@/lib/components/sandbox/previewIframeHost";
import { ChangelogDialogGate } from "@/lib/components/ChangelogDialogGate";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

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
  useDocumentTitle();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isSignedIn } = useAuth();

  // The anonymous landing is the one route that needs no Convex. Skipping the
  // provider there keeps marketing visitors from opening a WebSocket to the
  // production deployment (ClientProvider's presence/user bootstrapping and
  // ChangelogDialogGate each subscribe immediately on mount). Every other
  // public route (preview-auth, mcp/oauth/authorize) calls Convex hooks
  // unconditionally, so they keep the provider even when signed out.
  const anonymousLanding = pathname === "/" && isSignedIn !== true;

  const app = (
    <>
      <NuqsAdapter>
        <AppShell>
          <Outlet />
        </AppShell>
        {/* Preview iframes survive ALL route changes by living here, outside
            the router. Mounted after AppShell so equal-z fixed layers paint
            above routed content; Radix portals (z-50) still stack above. */}
        <PreviewIframeHost />
      </NuqsAdapter>
      <AppToaster />
      <Analytics />
      {DevAgentation ? (
        <Suspense fallback={null}>
          <DevAgentation />
        </Suspense>
      ) : null}
    </>
  );

  if (anonymousLanding) {
    return app;
  }

  return (
    <ClientProvider>
      {app}
      <ChangelogDialogGate />
    </ClientProvider>
  );
}
