import { createFileRoute } from "@tanstack/react-router";
import { WhatsNewClient } from "./whats-new/WhatsNewClient";

export const Route = createFileRoute("/_global/whats-new")({
  staticData: { title: "What's New" },
  component: WhatsNewClient,
});
