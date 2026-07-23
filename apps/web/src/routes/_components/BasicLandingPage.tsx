"use client";

import type { ComponentType } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { m, type Variants } from "motion/react";
import { Button, cn } from "@conductor/ui";
import { LANDING_PLATFORM_SECTIONS } from "./landingTaskDetailFixtures";

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
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: LANDING_EASE },
  },
};

interface BasicLandingPageProps {
  agentRedirect?: boolean;
}

/** Hero + capability cards — first marketing landing (pre–product-mock). */
export function BasicLandingPage({ agentRedirect }: BasicLandingPageProps) {
  const navigate = useNavigate();

  if (agentRedirect) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <main className="landing-atmosphere relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
        <m.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16"
        >
          <div className="flex flex-col gap-8">
            <m.div variants={STAGGER_ITEM} className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-muted/50 p-3">
                  <img
                    src="/icon.svg"
                    alt=""
                    width={56}
                    height={56}
                    className="size-14"
                  />
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                    Eva
                  </p>
                  <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Your AI coworker
                  </h1>
                </div>
              </div>

              <p className="max-w-md text-pretty text-lg leading-relaxed text-foreground/90 sm:text-xl">
                Ship from your repos — plan work, run sandboxes, open PRs, and
                keep docs aligned with the code.
              </p>

              <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
                <span className="text-primary/80">&gt;</span> ready · projects ·
                sessions · quick tasks · docs
              </p>
            </m.div>

            <m.div
              variants={STAGGER_ITEM}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <SignUpButton mode="modal">
                <Button size="lg" className="h-11 px-8 text-sm font-medium">
                  Get started
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 px-8 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                >
                  Sign in
                </Button>
              </SignInButton>
            </m.div>

            {isDev ? (
              <m.div variants={STAGGER_ITEM}>
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
              </m.div>
            ) : null}
          </div>

          <m.div
            variants={STAGGER_ITEM}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {LANDING_PLATFORM_SECTIONS.map((section, index) => (
              <LandingFeatureCard
                key={section.label}
                icon={section.icon}
                label={section.label}
                description={section.shortDesc}
                className={cn(index === 0 && "sm:col-span-2 lg:col-span-1")}
              />
            ))}
          </m.div>
        </m.div>
      </div>
    </main>
  );
}

function LandingFeatureCard({
  icon: Icon,
  label,
  description,
  className,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-surface bg-muted/40 p-4 transition-[background-color] hover:bg-muted/55 sm:p-5",
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 transition-[background-color] group-hover:bg-primary/15">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
