"use client";

import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { motion, type Variants } from "motion/react";
import { Button } from "@conductor/ui";
import { LandingCapabilityGrid } from "./LandingCapabilityGrid";
import { LandingTaskDetailMock } from "./LandingTaskDetailMock";
import { LandingWorkflowStrip } from "./LandingWorkflowStrip";

const isDev = import.meta.env.DEV;

const LANDING_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: LANDING_EASE },
  },
};

const MOCK_ITEM: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.62, ease: LANDING_EASE, delay: 0.12 },
  },
};

interface NewLandingPageProps {
  agentRedirect?: boolean;
}

export function NewLandingPage({ agentRedirect }: NewLandingPageProps) {
  const navigate = useNavigate();

  if (agentRedirect) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <main className="landing-atmosphere landing-grain landing-beam relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/15 to-background"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          className="flex flex-1 flex-col justify-center"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-14">
            <div className="flex flex-col gap-8 sm:gap-9">
              <motion.div variants={STAGGER_ITEM} className="space-y-7">
                <div className="relative">
                  <div
                    aria-hidden
                    className="landing-orb pointer-events-none absolute -left-10 -top-10 size-36 rounded-full bg-primary/12 blur-3xl"
                  />
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <div className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-primary/10 sm:size-20">
                      <img
                        src="/icon.svg"
                        alt=""
                        width={56}
                        height={56}
                        className="size-12 sm:size-14"
                      />
                    </div>
                    <div className="space-y-4 pt-0.5 sm:pt-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-primary sm:text-[11px]">
                        Eva
                      </p>
                      <h1 className="landing-display text-balance text-[2.35rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                        <span className="block">Your AI</span>
                        <span className="landing-headline-emphasis block">
                          coworker
                        </span>
                      </h1>
                      <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-[1.05rem] sm:leading-relaxed">
                        Plan work in your repos, run remote sandboxes, ship pull
                        requests, and keep docs aligned with the code.
                      </p>
                    </div>
                  </div>
                </div>

                <LandingWorkflowStrip />
                <LandingCapabilityGrid />
              </motion.div>

              <motion.div
                variants={STAGGER_ITEM}
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="h-11 min-w-[10rem] px-8 text-sm font-medium transition-[transform,background-color] hover:scale-[1.02]"
                  >
                    Get started
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="h-11 px-8 text-sm font-medium text-muted-foreground transition-[background-color] hover:bg-muted/60 hover:text-foreground"
                  >
                    Sign in
                  </Button>
                </SignInButton>
              </motion.div>

              {isDev ? (
                <motion.div variants={STAGGER_ITEM}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    onClick={() => {
                      navigate({ to: "/", search: { agent: true } });
                    }}
                  >
                    Sign in as Eva
                  </Button>
                </motion.div>
              ) : null}
            </div>

            <motion.div variants={MOCK_ITEM} className="landing-mock-stage">
              <p className="mb-3 hidden font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50 lg:block">
                Product preview
              </p>
              <div className="landing-mock-float">
                <LandingTaskDetailMock />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          variants={STAGGER_ITEM}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.6, duration: 0.45 }}
          className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/55 sm:mt-16"
        >
          Built for engineering teams shipping from real codebases
        </motion.p>
      </div>
    </main>
  );
}
