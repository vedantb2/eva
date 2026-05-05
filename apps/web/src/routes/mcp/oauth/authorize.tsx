import { createFileRoute } from "@tanstack/react-router";
import { SignInButton } from "@clerk/clerk-react";
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api } from "@conductor/backend";
import { Button, Spinner } from "@conductor/ui";

const searchSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

type AuthorizeSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/mcp/oauth/authorize")({
  validateSearch: searchSchema,
  component: McpOauthAuthorize,
});

function McpOauthAuthorize() {
  const search = Route.useSearch();
  return (
    <Shell>
      <AuthLoading>
        <Status>Loading…</Status>
      </AuthLoading>
      <Unauthenticated>
        <SignInPrompt />
      </Unauthenticated>
      <Authenticated>
        <AuthorizedFlow search={search} />
      </Authenticated>
    </Shell>
  );
}

/** Mints an authorization code via Convex and redirects to the OAuth client's redirect_uri. */
function AuthorizedFlow({ search }: { search: AuthorizeSearch }) {
  const authorize = useMutation(api.mcp.oauth.authorize);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    authorize({
      clientId: search.client_id,
      redirectUri: search.redirect_uri,
      codeChallenge: search.code_challenge,
      codeChallengeMethod: search.code_challenge_method,
    })
      .then(({ code }) => {
        const target = new URL(search.redirect_uri);
        target.searchParams.set("code", code);
        target.searchParams.set("state", search.state);
        window.location.replace(target.toString());
      })
      .catch(() => {
        setError("Please try connecting Claude again.");
      });
  }, [authorize, search]);

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

  return <Status>Connecting Claude to Eva…</Status>;
}

function SignInPrompt() {
  const currentUrl = window.location.href;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-medium text-foreground">
        Sign in to Eva to connect Claude
      </p>
      <SignInButton
        mode="redirect"
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
          src="/icon.png"
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
