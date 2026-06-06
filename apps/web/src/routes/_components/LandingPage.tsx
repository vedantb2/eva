"use client";

import { newLandingEnabled } from "@/env/client";
import { BasicLandingPage } from "./BasicLandingPage";
import { NewLandingPage } from "./NewLandingPage";

interface LandingPageProps {
  agentRedirect?: boolean;
}

export function LandingPage({ agentRedirect }: LandingPageProps) {
  if (newLandingEnabled) {
    return <NewLandingPage agentRedirect={agentRedirect} />;
  }

  return <BasicLandingPage agentRedirect={agentRedirect} />;
}
