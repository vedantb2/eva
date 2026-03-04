"use client";

import {
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  useQuery,
  AuthLoading,
  Authenticated,
} from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider, Spinner } from "@conductor/ui";
import { clientEnv } from "@/env/client";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

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

function PresenceHeartbeat() {
  const userId = useQuery(api.auth.me);
  if (!userId) return null;
  return <PresenceInner userId={userId} />;
}

function PresenceInner({ userId }: { userId: Id<"users"> }) {
  usePresence(api.presence, "platform", userId);
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
            <AuthLoading>
              <div className="min-h-screen w-full bg-background">
                <Spinner size="lg" />
              </div>
            </AuthLoading>
            <Authenticated>
              <ThemeProvider>
                <TooltipProvider delayDuration={300}>
                  {children}
                  <PresenceHeartbeat />
                </TooltipProvider>
              </ThemeProvider>
            </Authenticated>
          </NextThemesProvider>
        </ConvexQueryCacheProvider>
      </ConvexProviderWithClerk>
    </NuqsAdapter>
  );
}
