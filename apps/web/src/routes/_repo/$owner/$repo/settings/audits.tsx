import { createFileRoute } from "@tanstack/react-router";
import { AuditsClient } from "./AuditsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/audits")({
  component: AuditsClient,
});
