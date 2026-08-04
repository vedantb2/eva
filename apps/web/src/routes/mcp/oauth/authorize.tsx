import { createFileRoute } from "@tanstack/react-router";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import {
  clearMcpOauthParams,
  mcpOauthParamsSchema,
  saveMcpOauthParams,
  type McpOauthParams,
} from "@/lib/mcpOauthStorage";

export const Route = createFileRoute("/mcp/oauth/authorize")({
  validateSearch: mcpOauthParamsSchema,
  // Persist the OAuth params before any auth-driven redirect can strip them.
  // Prod Clerk live keys can bounce us to `/home` during the popup's session
  // handshake; `/home` reads this storage to recover us back into the flow.
  // Skipped on preload so a hover cannot overwrite stored params with a
  // half-filled search from some other link.
  beforeLoad: ({ search, preload }) => {
    if (preload) return;
    saveMcpOauthParams(search);
  },
  component: McpOauthAuthorize,
});

/**
 * Gates on Clerk's auth state (not Convex's). If we gated on Convex's
 * `<Unauthenticated>`, a signed-in user with a transient Convex auth
 * loading state could see the sign-in button, click it, and Clerk would
 * redirect them to `signInFallbackRedirectUrl="/home"` (since they're
 * already signed in and there's no real sign-in flow to complete).
 */
function McpOauthAuthorize() {
  const search = Route.useSearch();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <Shell>
        <Status>Loading…</Status>
      </Shell>
    );
  }

  if (!isSignedIn) {
    return (
      <Shell>
        <SignInPrompt />
      </Shell>
    );
  }

  return (
    <Shell>
      <AuthorizedFlow search={search} />
    </Shell>
  );
}

/** Mints an authorization code via Convex and redirects to the OAuth client's redirect_uri. */
function AuthorizedFlow({ search }: { search: McpOauthParams }) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const authorize = useMutation(api.mcp.oauth.authorize);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (convexLoading || !isAuthenticated) return;
    if (startedRef.current) return;
    startedRef.current = true;

    authorize({
      clientId: search.client_id,
      redirectUri: search.redirect_uri,
      codeChallenge: search.code_challenge,
      codeChallengeMethod: search.code_challenge_method,
    })
      .then(({ code }) => {
        clearMcpOauthParams();
        const target = new URL(search.redirect_uri);
        target.searchParams.set("code", code);
        target.searchParams.set("state", search.state);
        window.location.replace(target.toString());
      })
      .catch((err) => {
        const detail =
          err instanceof Error ? err.message : "Authorization failed";
        setError(detail);
      });
  }, [authorize, search, convexLoading, isAuthenticated]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t complete authorization
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return <Status>Connecting to Eva…</Status>;
}

function SignInPrompt() {
  const currentUrl = window.location.href;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-medium text-foreground">
        Sign in to Eva to connect your MCP client
      </p>
      <SignInButton
        forceRedirectUrl={currentUrl}
        fallbackRedirectUrl={currentUrl}
        signUpForceRedirectUrl={currentUrl}
        signUpFallbackRedirectUrl={currentUrl}
      >
        <Button size="lg">Sign in</Button>
      </SignInButton>
    </div>
  );
}

function Status({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="md" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <img
          src="/icon.svg"
          alt="Eva"
          width={56}
          height={56}
          className="rounded-2xl outline outline-1 outline-black/10 dark:outline-white/10"
        />
        {children}
      </div>
    </div>
  );
}
