"use client";

import { lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@eva/ui";
import { newLandingEnabled } from "@/env/client";
import { LandingCompact } from "./landing/LandingCompact";

const isDev = import.meta.env.DEV;

const LandingFull = lazy(() =>
  import("./landing/LandingFull").then((m) => ({ default: m.LandingFull })),
);

interface LandingPageProps {
  agentRedirect?: boolean;
}

/**
 * Marketing page. Thin orchestrator — the compact door is the default so a
 * first visit never downloads the long-scroll mocks. `VITE_NEW_LANDING`
 * swaps in `LandingFull` as a separate chunk.
 */
export function LandingPage({ agentRedirect }: LandingPageProps) {
  // `?agent` is mid-redirect to the agent login route; render a blank canvas
  // rather than flashing the whole marketing page.
  if (agentRedirect) {
    return <div className="min-h-dvh w-full bg-background" />;
  }

  if (!newLandingEnabled) {
    return (
      <>
        <LandingCompact />
        <AgentSignIn />
      </>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-dvh w-full bg-background" />}>
      <LandingFull />
      <AgentSignIn />
    </Suspense>
  );
}

/**
 * Dev-only shortcut into the agent account, rendered by both versions of the
 * page so switching `VITE_NEW_LANDING` never takes it away.
 */
function AgentSignIn() {
  const navigate = useNavigate();

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        size="sm"
        variant="outline"
        className="shadow-lg"
        onClick={() => {
          navigate({ to: "/", search: { agent: true } });
        }}
      >
        Sign in as Eva
      </Button>
    </div>
  );
}
