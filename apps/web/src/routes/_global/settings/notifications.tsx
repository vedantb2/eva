import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSettingsClient } from "@/lib/components/notifications/NotificationsSettingsClient";

export const Route = createFileRoute("/_global/settings/notifications")({
  staticData: { title: "Settings" },
  component: NotificationsSettingsClient,
});
