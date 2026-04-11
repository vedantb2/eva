import { createFileRoute } from "@tanstack/react-router";
import { PersonalisationClient } from "@/lib/components/personalisation/PersonalisationClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/personalisation",
)({
  component: PersonalisationClient,
});
