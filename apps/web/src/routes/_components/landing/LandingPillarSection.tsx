"use client";

import { IconCheck } from "@tabler/icons-react";
import type { LandingFeature, LandingPillar } from "./landingContent";
import {
  LandingLattice,
  LandingReveal,
  LandingSection,
  LandingSectionHeading,
} from "./LandingPrimitives";

/** One stage of the workflow: heading plus a hairline grid of its features. */
export function LandingPillarSection({ pillar }: { pillar: LandingPillar }) {
  return (
    <LandingSection id={pillar.id}>
      <LandingReveal>
        <LandingSectionHeading
          eyebrow={`${pillar.step} — ${pillar.label}`}
          heading={pillar.heading}
          intro={pillar.intro}
        />
        <LandingLattice className={`mt-12 ${pillar.gridClass}`}>
          {pillar.features.map((feature) => (
            <LandingFeatureCell key={feature.name} feature={feature} />
          ))}
        </LandingLattice>
      </LandingReveal>
    </LandingSection>
  );
}

function LandingFeatureCell({ feature }: { feature: LandingFeature }) {
  const Icon = feature.icon;

  return (
    <div className="motion-base group flex flex-col gap-4 bg-background p-6 hover:bg-muted/30">
      <div className="motion-base flex size-9 items-center justify-center rounded-lg border border-border bg-card group-hover:border-primary/25">
        <Icon size={17} className="text-primary" aria-hidden />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-medium text-foreground">
          {feature.name}
        </h3>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {feature.summary}
        </p>
      </div>

      <ul className="mt-auto space-y-2 pt-1">
        {feature.points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <IconCheck
              size={14}
              className="mt-0.5 shrink-0 text-primary/70"
              aria-hidden
            />
            <span className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
