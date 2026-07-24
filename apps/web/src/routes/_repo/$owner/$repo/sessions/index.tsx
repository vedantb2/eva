import { createFileRoute } from "@tanstack/react-router";
import { NewSessionComposer } from "./_components/NewSessionComposer";

export const Route = createFileRoute("/_repo/$owner/$repo/sessions/")({
  component: SessionsPage,
});

function SessionsPage() {
  return <NewSessionComposer showBaseBranch />;
}
