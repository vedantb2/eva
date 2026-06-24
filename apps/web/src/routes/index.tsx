import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LandingPage } from "./_components/LandingPage";

const searchSchema = z.object({
  agent: z.boolean().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (search.agent) {
      window.location.href = "/api/auth/agent-login";
    }
    if (context.isSignedIn) {
      throw redirect({ to: "/home" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { agent } = Route.useSearch();
  return <LandingPage agentRedirect={agent === true} />;
}
