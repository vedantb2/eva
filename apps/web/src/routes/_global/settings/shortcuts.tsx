import { createFileRoute } from "@tanstack/react-router";
import { ShortcutsSettingsClient } from "@/lib/components/settings/shortcuts/ShortcutsSettingsClient";

export const Route = createFileRoute("/_global/settings/shortcuts")({
  staticData: { title: "Settings" },
  component: ShortcutsSettingsClient,
});
