import { createFileRoute, redirect } from "@tanstack/react-router";
import { consumeMcpOauthParams } from "@/lib/mcpOauthStorage";
import { ReposClient } from "./home/ReposClient";

export const Route = createFileRoute("/_global/home")({
  // If the user landed here mid-MCP OAuth flow (Clerk's prod handshake can
  // redirect to the global `signInFallbackRedirectUrl` before our authorize
  // route can mint the code), bounce them back into the flow.
  beforeLoad: () => {
    const pending = consumeMcpOauthParams();
    if (pending) {
      throw redirect({
        to: "/mcp/oauth/authorize",
        search: pending,
      });
    }
  },
  component: ReposClient,
});
