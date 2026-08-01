"use client";

import { SignUpButton } from "@clerk/clerk-react";
import { IconArrowRight, IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@eva/ui";
import { EVA_GITHUB_URL } from "./landingContent";
import { LandingReveal, LandingSection } from "./LandingPrimitives";

/** Closing band. Reuses the hero atmosphere so the page ends where it started. */
export function LandingCta() {
  return (
    <div className="landing-atmosphere landing-grain relative overflow-hidden border-t border-border">
      <LandingSection className="relative z-10">
        <LandingReveal className="flex flex-col items-center text-center">
          <h2 className="landing-display max-w-2xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Point Eva at a repository.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Connect GitHub, pick an agent, and describe the change. Eva handles
            the environment, the branch and the pull request.
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto sm:min-w-[10rem]">
                Get started
                <IconArrowRight className="size-4" aria-hidden />
              </Button>
            </SignUpButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <a href={EVA_GITHUB_URL} target="_blank" rel="noreferrer">
                <IconBrandGithub className="size-4" aria-hidden />
                Self-host it
              </a>
            </Button>
          </div>
        </LandingReveal>
      </LandingSection>
    </div>
  );
}
