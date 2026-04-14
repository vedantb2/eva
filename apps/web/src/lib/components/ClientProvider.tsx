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
import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider } from "@conductor/ui";
import { AppSkeleton } from "./AppSkeleton";
import { clientEnv } from "@/env/client";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

if (!clientEnv.VITE_CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL in your .env file");
}

export const convex = new ConvexReactClient(clientEnv.VITE_CONVEX_URL);

// Tracks whether the user has been signed in during this page session.
// Used by useStableAuth to detect unexpected auth loss (stale deployment).
let wasEverSignedIn = false;

/**
 * Wraps Clerk's useAuth to debounce unexpected auth loss.
 *
 * When Vercel deploys a new version, stale JS can break Clerk's internals,
 * causing it to report isSignedIn:false even though the user has a valid session.
 * ConvexProviderWithClerk then clears the auth token, and the Convex server
 * re-evaluates every active subscription without auth — producing a burst of
 * "Not authenticated" errors in the Convex logs.
 *
 * To prevent this: when auth drops from signed-in → not-signed-in, we tell
 * Convex "auth is still loading" for 2 seconds. During that window:
 * - Stale deployment: page reloads, WebSocket closes, subscriptions drop cleanly
 * - Real logout: routes unmount via InnerApp/router (which reads Clerk directly),
 *   subscriptions are cleaned up, then the timer fires and propagates the real state
 *
 * In both cases Convex never re-evaluates subscriptions without auth.
 */
function useStableAuth() {
  const auth = useAuth();
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (auth.isSignedIn) {
      wasEverSignedIn = true;
      setOverrideLoading(false);
      return;
    }

    // Was signed in and now not — debounce to avoid Convex auth cascade
    if (wasEverSignedIn && auth.isLoaded && !auth.isSignedIn) {
      setOverrideLoading(true);
      const timer = setTimeout(() => {
        wasEverSignedIn = false;
        setOverrideLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    setOverrideLoading(false);
  }, [auth.isLoaded, auth.isSignedIn]);

  if (overrideLoading) {
    return { ...auth, isLoaded: false };
  }
  return auth;
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
    <ConvexProviderWithClerk client={convex} useAuth={useStableAuth}>
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
        <AppSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/" />
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
