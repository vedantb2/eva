import { createFileRoute } from "@tanstack/react-router";
import { InboxClient } from "@/lib/components/inbox/InboxClient";

export const Route = createFileRoute("/_repo/$owner/$repo/inbox")({
  component: InboxClient,
});
