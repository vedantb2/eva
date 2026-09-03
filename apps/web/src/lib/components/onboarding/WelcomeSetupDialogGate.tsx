"use client";

import { lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@eva/backend";
import { useDevWelcomeSetupPreview } from "@/lib/dev/preview";

/**
 * Decides whether the welcome wizard is needed before its code is fetched.
 *
 * The dialog pulls the role picker, theme steps and typography preview.
 * Mounting it on every signed-in page made that graph part of the home
 * chunk. The onboarding query is already reactive and cached — only the
 * rare first-run (or `?preview=welcome-setup`) downloads the wizard.
 */
const WelcomeSetupDialog = lazy(() =>
  import("./WelcomeSetupDialog").then((m) => ({
    default: m.WelcomeSetupDialog,
  })),
);

export function WelcomeSetupDialogGate() {
  const isPreview = useDevWelcomeSetupPreview();
  const onboarding = useQuery(api.auth.getOnboardingStatus);

  if (!isPreview && !onboarding?.show) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <WelcomeSetupDialog />
    </Suspense>
  );
}
