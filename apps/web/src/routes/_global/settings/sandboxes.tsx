import { createFileRoute } from "@tanstack/react-router";
import { SandboxAutoStopSettingsClient } from "@/lib/components/sandboxes/SandboxAutoStopSettingsClient";

export const Route = createFileRoute("/_global/settings/sandboxes")({
  staticData: { title: "Settings" },
  component: SandboxAutoStopSettingsClient,
});
