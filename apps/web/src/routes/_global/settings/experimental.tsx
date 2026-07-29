import { createFileRoute } from "@tanstack/react-router";
import { ExperimentalSettingsClient } from "@/lib/components/settings/ExperimentalSettingsClient";

export const Route = createFileRoute("/_global/settings/experimental")({
  staticData: { title: "Settings" },
  component: ExperimentalSettingsClient,
});
