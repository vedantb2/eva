import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@conductor/ui";
import { clientEnv } from "@/env/client";
import { z } from "zod";

const isProduction = clientEnv.VITE_ENV === "production";

const searchSchema = z.object({
  agent: z.boolean().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (search.agent) {
      // Redirect to agent login endpoint
      window.location.href = "/api/auth/agent-login";
    }
    if (context.isSignedIn) {
      throw redirect({ to: "/home" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { agent } = Route.useSearch();

  // Show loading state while redirecting to agent login
  if (agent) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icon.png"
            alt="Eva"
            width={80}
            height={80}
            className="rounded-2xl outline outline-1 outline-black/10 dark:outline-white/10"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Eva
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Your AI Coworker
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isProduction ? (
            <>
              <Button size="lg" variant="default" disabled>
                Sign In
              </Button>
              <Button size="lg" variant="outline" disabled>
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button size="lg" variant="default">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline">
                  Sign Up
                </Button>
              </SignUpButton>
            </>
          )}
        </div>

        {!isProduction && (
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                navigate({ to: "/", search: { agent: true } });
              }}
            >
              Sign in as Eva
            </Button>
          </div>
        )}

        {isProduction && (
          <div className="max-w-sm rounded-lg bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            Eva is fully open source and self-hosted. Clone the repo, create
            your own Convex and Clerk projects, and run it locally.
          </div>
        )}
      </div>
    </div>
  );
}
