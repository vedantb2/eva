"use client";

import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHero } from "./LandingHero";
import { LandingMcp } from "./LandingMcp";
import { LandingNav } from "./LandingNav";
import { LandingOpenSource } from "./LandingOpenSource";
import { LandingPillarSection } from "./LandingPillarSection";
import { LandingSandbox } from "./LandingSandbox";
import { LandingWorkflow } from "./LandingWorkflow";
import { LANDING_PILLARS } from "./landingContent";

/**
 * Long-scroll marketing page. Kept out of `LandingPage.tsx` so the default
 * compact door does not download sixteen animated mocks, motion variants, or
 * the hero task-detail fixture — those were previously static imports and sat
 * on the landing chunk even when `VITE_NEW_LANDING` was off.
 */
export function LandingFull() {
  return (
    <div id="top" className="min-h-dvh bg-background">
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
    </div>
  );
}
