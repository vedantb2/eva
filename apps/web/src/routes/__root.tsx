import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { Analytics } from "@vercel/analytics/react";
import { ClientProvider } from "@/lib/components/ClientProvider";
import { clientEnv } from "@/env/client";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ClerkProvider
      publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    >
      <ClientProvider>
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
      </ClientProvider>
      <Analytics />
    </ClerkProvider>
  );
}
