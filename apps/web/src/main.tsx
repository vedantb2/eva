import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { queryClient } from "./lib/queryClient";
import { routeTree } from "./routeTree.gen";
import { createAppHistory } from "./lib/history";
import { toDisplayRepoHref, toInternalRepoHref } from "./lib/utils/repoUrl";
import { clientEnv } from "./env/client";
import { convex } from "./lib/convex";
import { DeploymentErrorFallback } from "./lib/components/DeploymentErrorFallback";
import { MotionProvider } from "./lib/components/MotionProvider";
import { isChunkLoadError } from "./lib/utils/isChunkLoadError";
import { readSignedInHint } from "./lib/authHint";
import { saveMcpOauthParamsFromUrl } from "./lib/mcpOauthStorage";
import { migrateLegacyStorageKeys } from "./lib/migrateLegacyStorageKeys";
import { InnerApp } from "./InnerApp";
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

// Read once at boot: whether the LAST visit ended signed in. Clerk's session
// handshake costs ~200 kB of clerk-js plus a network round trip, and holding
// first paint on it makes anonymous visitors stare at a blank screen for
// nothing — they have no session to restore.
const hadSession = readSignedInHint();

// The app chrome (sidebar, spotlight search, hotkeys) is a lazy chunk so the
// anonymous landing never downloads it. Returning users need it immediately,
// so start fetching now — it downloads in parallel with Clerk's handshake.
if (hadSession) {
  void import("@/lib/components/AppShellChrome");
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
            <InnerApp hadSession={hadSession} router={router} />
          </ClerkProvider>
        </MotionProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
