import { createFileRoute } from "@tanstack/react-router";
import { TeamsClient } from "./TeamsClient";

export const Route = createFileRoute("/_global/teams/")({
  component: TeamsClient,
});
