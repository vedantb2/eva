"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  AuthLoading,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/clerk-react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeModeProvider } from "@/lib/components/ThemeModeProvider";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider, Spinner } from "@conductor/ui";
import { clientEnv } from "@/env/client";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

if (!clientEnv.VITE_CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(clientEnv.VITE_CONVEX_URL);

function RedirectToLanding() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-background">
      <Spinner size="lg" />
    </div>
  );
}

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
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </ConvexQueryCacheProvider>
    </ConvexProviderWithClerk>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen w-full bg-background">
          <Spinner size="lg" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>
      <Authenticated>
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <PresenceHeartbeat />
          </TooltipProvider>
        </ThemeProvider>
      </Authenticated>
    </>
  );
}
