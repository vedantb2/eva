import { createFileRoute } from "@tanstack/react-router";
import { StatsClient } from "./stats/StatsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/stats")({
  component: StatsClient,
});
