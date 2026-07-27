"use client";

import { LANDING_SANDBOX_SPEC } from "./landingContent";
import {
  LandingLattice,
  LandingReveal,
  LandingSection,
  LandingSectionHeading,
} from "./LandingPrimitives";

/**
 * What the agent is actually running on. Contents mirror the snapshot image in
 * `snapshotActions.ts`; the band background breaks up the page between the
 * feature grids and the MCP section.
 */
export function LandingSandbox() {
  return (
    <div
      id="sandbox"
      className="scroll-mt-16 border-y border-border bg-muted/30"
    >
      <LandingSection>
        <LandingReveal>
          <LandingSectionHeading
            eyebrow="The environment"
            heading="A real machine, not a toy sandbox."
            intro="Every task boots a cloud VM from a prebuilt snapshot. Docker runs inside it. So does a desktop and a real browser, which is how an agent takes a screenshot of the thing it just changed."
          />

          <LandingLattice className="mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_SANDBOX_SPEC.map((group) => (
              <div key={group.label} className="bg-background p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
                  {group.label}
                </p>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground">
                  {group.items}
                </p>
              </div>
            ))}
          </LandingLattice>

          <p className="mt-6 text-sm text-muted-foreground">
            Snapshot builds usually finish in about six minutes. Rebuild on a
            cron or on demand, and a missing snapshot falls back to a fresh
            clone rather than failing the run.
          </p>
        </LandingReveal>
      </LandingSection>
    </div>
  );
}
