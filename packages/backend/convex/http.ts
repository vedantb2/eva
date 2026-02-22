import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

function verifyMcpBootstrapToken(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const expected = process.env.MCP_JWT_SECRET;
  if (!expected) return false;
  return auth === `MCPBootstrap ${expected}`;
}

function verifyDeployKey(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const expected = process.env.CONDUCTOR_DEPLOY_KEY;
  if (!expected) return false;
  return auth === `Convex ${expected}`;
}

function hasRepoId(body: object): body is { repoId: unknown } {
  return "repoId" in body;
}

function parseRepoId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  if (!hasRepoId(body)) return null;
  if (typeof body.repoId !== "string" || body.repoId.length === 0) return null;
  return body.repoId;
}

http.route({
  path: "/api/mcp/bootstrap",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    if (!verifyMcpBootstrapToken(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const deployKey = process.env.CONDUCTOR_DEPLOY_KEY;
    if (!deployKey) {
      return new Response(
        "CONDUCTOR_DEPLOY_KEY is not configured in Convex env vars",
        { status: 500 },
      );
    }
    return Response.json({ deployKey });
  }),
});

http.route({
  path: "/api/mcp/env-vars",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyDeployKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body: unknown = await request.json();
    const repoId = parseRepoId(body);
    if (!repoId) {
      return new Response("Invalid request body: repoId required", {
        status: 400,
      });
    }

    const vars = await ctx.runAction(
      internal.mcpRoutes.getDecryptedRepoEnvVars,
      { repoId },
    );
    return Response.json(vars);
  }),
});

export default http;
