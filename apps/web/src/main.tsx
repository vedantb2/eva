import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { queryClient } from "./lib/queryClient";
import { routeTree } from "./routeTree.gen";
import { createAppHistory } from "./lib/history";
import { clientEnv } from "./env/client";
import { convex } from "./lib/components/ClientProvider";
import { DeploymentErrorFallback } from "./lib/components/DeploymentErrorFallback";
import { AuthLoadingScreen } from "./lib/components/AuthLoadingScreen";
import { MotionProvider } from "./lib/components/MotionProvider";
import { isChunkLoadError } from "./lib/utils/isChunkLoadError";
import { saveMcpOauthParamsFromUrl } from "./lib/mcpOauthStorage";
import { migrateLegacyStorageKeys } from "./lib/migrateLegacyStorageKeys";
import "./fonts";
import "./globals.css";

// Persist any in-flight MCP OAuth params before Clerk's session handshake
// gets a chance to redirect us off `/mcp/oauth/authorize`. See
// `mcpOauthStorage.ts` for the full flow.
saveMcpOauthParamsFromUrl();

// Moves persisted sandbox UI state off the legacy `conductor:` key prefix. Must
// run before React mounts so the hooks reading these keys see migrated values on
// first render. Remove once the legacy prefix is safely extinct.
migrateLegacyStorageKeys();

/**
 * Handles stale deployment detection: closes the Convex WebSocket to prevent
 * a cascade of "Not authenticated" server errors, then reloads the page.
 */
function handleStaleDeployment(event: Event) {
  event.preventDefault();
  try {
    convex.close();
  } catch {
    // WebSocket may already be closed
  }
  window.location.reload();
}

// After a new Vercel deployment, cached HTML may reference old chunk hashes that no longer exist.
// Reload the page so the browser fetches the new HTML with correct asset references.
window.addEventListener("vite:preloadError", handleStaleDeployment);

// Catch chunk loading failures that bypass Vite's preload detection
// (e.g. dynamic imports triggered by route navigation or lazy components).
window.addEventListener("error", (event) => {
  if (isChunkLoadError(event.error)) {
    handleStaleDeployment(event);
  }
});
window.addEventListener("unhandledrejection", (event) => {
  if (isChunkLoadError(event.reason)) {
    handleStaleDeployment(event);
  }
});

const router = createRouter({
  routeTree,
  history: createAppHistory(),
  context: { isSignedIn: false },
  defaultErrorComponent: DeploymentErrorFallback,
  // Fetch a route's chunk while the pointer rests on its link, so the click
  // renders from cache instead of waiting on the network. Routes with a
  // side-effecting `beforeLoad` must bail out on the `preload` flag — see
  // `routes/index.tsx` and `routes/_global/home.tsx`.
  defaultPreload: "intent",
  // Twice the 50ms default: long enough that dragging the pointer across a
  // sidebar does not queue a fetch for every item it crosses.
  defaultPreloadDelay: 100,
  // Monorepo apps: address bar + link hrefs use /owner/repo/app/… while the
  // route tree matches /owner/repo--app/… (single $repo segment).
  rewrite: {
    input: ({ url }) => {
      url.pathname = toInternalRepoHref(url.pathname);
      return url;
    },
    output: ({ url }) => {
      url.pathname = toDisplayRepoHref(url.pathname);
      return url;
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  return (
    <RouterProvider
      router={router}
      context={{ isSignedIn: isSignedIn ?? false }}
    />
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MotionProvider>
          <ClerkProvider
            publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
            signInFallbackRedirectUrl="/home"
            signUpFallbackRedirectUrl="/home"
          >
            <InnerApp />
          </ClerkProvider>
        </MotionProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
