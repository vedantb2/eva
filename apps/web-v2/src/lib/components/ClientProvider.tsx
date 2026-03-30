"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  AuthLoading,
  Authenticated,
} from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/clerk-react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeModeProvider } from "@/lib/components/ThemeModeProvider";
import { useEffect } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider, Spinner } from "@conductor/ui";
import { clientEnv } from "@/env/client";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

if (!clientEnv.VITE_CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(clientEnv.VITE_CONVEX_URL);

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
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ConvexQueryCacheProvider>
        <EnsureUser />
        <ThemeModeProvider>
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
        </ThemeModeProvider>
      </ConvexQueryCacheProvider>
    </ConvexProviderWithClerk>
  );
}
