import { createFileRoute } from "@tanstack/react-router";
import { TabsSettingsClient } from "./TabsSettingsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/tabs")({
  component: TabsSettingsClient,
});
