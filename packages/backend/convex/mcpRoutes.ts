"use node";

import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { decryptValue } from "./encryption";
import type { Id } from "./_generated/dataModel";

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

function isRepoId(id: string): id is Id<"githubRepos"> {
  return id.length > 0 && !/\s/.test(id);
}

function hasRepoId(body: object): body is { repoId: unknown } {
  return "repoId" in body;
}

function parseRepoEnvVarsBody(body: unknown): { repoId: string } | null {
  if (typeof body !== "object" || body === null) return null;
  if (!hasRepoId(body)) return null;
  if (typeof body.repoId !== "string" || body.repoId.length === 0) return null;
  return { repoId: body.repoId };
}

export const getMcpBootstrap = httpAction(async (_ctx, request) => {
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
});

export const getMcpRepoEnvVars = httpAction(async (ctx, request) => {
  if (!verifyDeployKey(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = parseRepoEnvVarsBody(body);
  if (!parsed) {
    return new Response("Invalid request body: repoId required", {
      status: 400,
    });
  }

  const { repoId } = parsed;
  if (!isRepoId(repoId)) {
    return new Response("Invalid repoId format", { status: 400 });
  }

  const vars = await ctx.runQuery(internal.repoEnvVars.getForSandbox, {
    repoId,
  });

  const decrypted = vars.map((entry) => ({
    key: entry.key,
    value: decryptValue(entry.value),
  }));

  return Response.json(decrypted);
});
