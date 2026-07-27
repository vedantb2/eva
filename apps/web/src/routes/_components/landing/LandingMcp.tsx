"use client";

import { IconBrowser } from "@tabler/icons-react";
import { LANDING_MCP_CARDS } from "./landingContent";
import {
  LandingLattice,
  LandingReveal,
  LandingSection,
  LandingSectionHeading,
} from "./LandingPrimitives";

/** MCP in both directions, plus the Chrome extension as a closing note. */
export function LandingMcp() {
  return (
    <LandingSection id="mcp">
      <LandingReveal>
        <LandingSectionHeading
          eyebrow="Integrations"
          heading="Eva speaks MCP in both directions."
          intro="Drive Eva from the MCP client you already use, and let agents inside a sandbox call back to Eva while they work."
        />

        <LandingLattice className="mt-12 lg:grid-cols-3">
          {LANDING_MCP_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.name}
                className="motion-base flex flex-col gap-4 bg-background p-6 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-card">
                    <Icon size={17} className="text-primary" aria-hidden />
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {card.name}
                  </h3>
                </div>

                <p className="text-pretty text-sm leading-relaxed text-foreground">
                  {card.summary}
                </p>

                <ul className="mt-auto space-y-2 border-t border-border pt-4">
                  {card.points.map((point) => (
                    <li
                      key={point}
                      className="text-pretty text-[13px] leading-relaxed text-muted-foreground"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </LandingLattice>

        <div className="mt-4 flex items-start gap-4 rounded-surface border border-border bg-card p-6 shadow-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <IconBrowser size={17} className="text-primary" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-medium text-foreground">
              Chrome extension
            </h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              An on-page toolbar for the app you are building. Annotate what is
              wrong where you found it, and file the task without switching
              tabs.
            </p>
          </div>
        </div>
      </LandingReveal>
    </LandingSection>
  );
}
