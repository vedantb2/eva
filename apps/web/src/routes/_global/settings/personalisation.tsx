import { createFileRoute } from "@tanstack/react-router";
import { PersonalisationClient } from "@/lib/components/personalisation/PersonalisationClient";

export const Route = createFileRoute("/_global/settings/personalisation")({
  component: PersonalisationClient,
});
