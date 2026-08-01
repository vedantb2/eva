import { createFileRoute } from "@tanstack/react-router";
import { ChangelogClient } from "./changelog/ChangelogClient";

export const Route = createFileRoute("/_global/changelog")({
  staticData: { title: "Changelog" },
  component: ChangelogClient,
});
