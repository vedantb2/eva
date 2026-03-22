import { createFileRoute } from "@tanstack/react-router";
import { ThemeSettingsClient } from "@/lib/components/theme/ThemeSettingsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/theme")({
  component: ThemeSettingsClient,
});
