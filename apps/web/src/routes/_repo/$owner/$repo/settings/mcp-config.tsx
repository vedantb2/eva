import { createFileRoute } from "@tanstack/react-router";
import { McpConfigClient } from "./McpConfigClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/mcp-config")(
  {
    component: McpConfigClient,
  },
);
