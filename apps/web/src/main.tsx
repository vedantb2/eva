import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { routeTree } from "./routeTree.gen";
import { createAppHistory } from "./lib/history";
import { clientEnv } from "./env/client";
import "./fonts";
import "./globals.css";

// After a new Vercel deployment, cached HTML may reference old chunk hashes that no longer exist.
// Reload the page so the browser fetches the new HTML with correct asset references.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  window.location.reload();
});

const router = createRouter({
  routeTree,
  history: createAppHistory(),
  context: { isSignedIn: false },
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
