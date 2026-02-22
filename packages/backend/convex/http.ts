"use node";

import { httpRouter } from "convex/server";
import { getMcpBootstrap, getMcpRepoEnvVars } from "./mcpRoutes.js";

const http = httpRouter();

http.route({
  path: "/api/mcp/bootstrap",
  method: "GET",
  handler: getMcpBootstrap,
});

http.route({
  path: "/api/mcp/env-vars",
  method: "POST",
  handler: getMcpRepoEnvVars,
});

export default http;
