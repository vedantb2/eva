"use client";

import { useNavigate } from "@tanstack/react-router";
import { Button } from "@conductor/ui";
import { LandingCta } from "./landing/LandingCta";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingHero } from "./landing/LandingHero";
import { LandingMcp } from "./landing/LandingMcp";
import { LandingNav } from "./landing/LandingNav";
import { LandingOpenSource } from "./landing/LandingOpenSource";
import { LandingPillarSection } from "./landing/LandingPillarSection";
import { LandingSandbox } from "./landing/LandingSandbox";
import { LandingWorkflow } from "./landing/LandingWorkflow";
import { LANDING_PILLARS } from "./landing/landingContent";

const isDev = import.meta.env.DEV;

interface LandingPageProps {
  agentRedirect?: boolean;
}

/**
 * Marketing page. Thin orchestrator — every section owns its own copy and
 * layout, and all strings live in `landing/landingContent.ts`.
 */
export function LandingPage({ agentRedirect }: LandingPageProps) {
  const navigate = useNavigate();

  // `?agent` is mid-redirect to the agent login route; render a blank canvas
  // rather than flashing the whole marketing page.
  if (agentRedirect) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <div id="top" className="min-h-screen bg-background">
      <LandingNav />

      <main>
        <LandingHero />
        <LandingWorkflow />

        {LANDING_PILLARS.map((pillar) => (
          <LandingPillarSection key={pillar.id} pillar={pillar} />
        ))}

        <LandingSandbox />
        <LandingMcp />
        <LandingOpenSource />
        <LandingCta />
      </main>

      <LandingFooter />

      {isDev ? (
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
      ) : null}
    </div>
  );
}
