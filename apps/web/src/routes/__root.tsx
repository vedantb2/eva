import { lazy, Suspense } from "react";
import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { TooltipProvider } from "@eva/ui";
import { AppToaster } from "@/lib/components/AppToaster";
import { AppShell } from "@/lib/components/AppShell";
import { AuthLoadingScreen } from "@/lib/components/AuthLoadingScreen";
import { DeferredAfterIdle } from "@/lib/components/DeferredAfterIdle";
import { IS_EMBEDDED } from "@/lib/embed/embedded";
import { EmbedNavigationBridge } from "@/lib/embed/EmbedNavigationBridge";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";

export interface RouterContext {
  isSignedIn: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/** Lazy so the agentation package stays out of the production bundle. */
const DevAgentation =
  import.meta.env.DEV &&
  typeof navigator !== "undefined" &&
  !/Chrome-Lighthouse/i.test(navigator.userAgent)
    ? lazy(() =>
        import("@/lib/components/DevAgentation").then((m) => ({
          default: m.DevAgentation,
        })),
      )
    : null;

const ClientProvider = lazy(() =>
  import("@/lib/components/ClientProvider").then((m) => ({
    default: m.ClientProvider,
  })),
);

const ChangelogDialogGate = lazy(() =>
  import("@/lib/components/ChangelogDialogGate").then((m) => ({
    default: m.ChangelogDialogGate,
  })),
);

const PreviewIframeHost = lazy(() =>
  import("@/lib/components/sandbox/previewIframeHost").then((m) => ({
    default: m.PreviewIframeHost,
  })),
);

const PreviewMiniPlayer = lazy(() =>
  import("@/lib/components/sandbox/PreviewMiniPlayer").then((m) => ({
    default: m.PreviewMiniPlayer,
  })),
);

const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })),
);

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
            the router. Signed-out marketing never mounts them — the host
            module pulls Convex + the iframe keep-alive into the landing
            chunk if it is a static import. */}
        {isSignedIn ? (
          <DeferredAfterIdle>
            <Suspense fallback={null}>
              <PreviewMiniPlayer />
              <PreviewIframeHost />
            </Suspense>
          </DeferredAfterIdle>
        ) : null}
      </NuqsAdapter>
      {IS_EMBEDDED ? <EmbedNavigationBridge /> : null}
      <AppToaster />
      {/* No analytics from embedded documents: the host page already counts. */}
      {IS_EMBEDDED ? null : (
        <DeferredAfterIdle>
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </DeferredAfterIdle>
      )}
      {DevAgentation ? (
        <Suspense fallback={null}>
          <DevAgentation />
        </Suspense>
      ) : null}
    </>
  );

  // One provider above everything, including the layers outside the app shell:
  // the preview mini player, the What's New dialog and the routes without
  // chrome (preview-auth, mcp/oauth) all render tooltips, and Radix throws
  // outright when a Tooltip has no Provider above it. Context only — no DOM,
  // so the anonymous landing pays nothing for it.
  return (
    <TooltipProvider>
      {anonymousLanding ? (
        app
      ) : (
        <Suspense fallback={<AuthLoadingScreen />}>
          <ClientProvider>
            {app}
            {/* The What's New dialog belongs to the top-level window, not previews. */}
            {IS_EMBEDDED ? null : (
              <DeferredAfterIdle>
                <Suspense fallback={null}>
                  <ChangelogDialogGate />
                </Suspense>
              </DeferredAfterIdle>
            )}
          </ClientProvider>
        </Suspense>
      )}
    </TooltipProvider>
  );
}
