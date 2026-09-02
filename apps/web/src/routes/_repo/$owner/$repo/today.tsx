import { createFileRoute } from "@tanstack/react-router";
import { TodayClient } from "./today/TodayClient";

export const Route = createFileRoute("/_repo/$owner/$repo/today")({
  staticData: { title: "Today" },
  component: TodayClient,
});
