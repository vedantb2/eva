import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { routeTree } from "./routeTree.gen";
import { createAppHistory } from "./lib/history";
import { clientEnv } from "./env/client";
import { convex } from "./lib/components/ClientProvider";
import { DeploymentErrorFallback } from "./lib/components/DeploymentErrorFallback";
import { isChunkLoadError } from "./lib/utils/isChunkLoadError";
import "./fonts";
import "./globals.css";

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
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="min-h-screen w-full bg-background" />;
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
      <ClerkProvider
        publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
        signInFallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/home"
      >
        <InnerApp />
      </ClerkProvider>
    </StrictMode>,
  );
}
