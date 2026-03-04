"use client";

import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider } from "@conductor/ui";
import { clientEnv } from "@/env/client";
import { api } from "@conductor/backend";

if (!clientEnv.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

function EnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUserExists = useMutation(api.auth.ensureUserExists);

  useEffect(() => {
    if (isAuthenticated) {
      ensureUserExists({}).catch(console.error);
    }
  }, [isAuthenticated, ensureUserExists]);

  return null;
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConvexQueryCacheProvider>
          <EnsureUser />
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeProvider>
              <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
            </ThemeProvider>
          </NextThemesProvider>
        </ConvexQueryCacheProvider>
      </ConvexProviderWithClerk>
    </NuqsAdapter>
  );
}
