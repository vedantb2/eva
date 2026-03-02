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
  const expected = process.env.EVA_DEPLOY_KEY;
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
    const deployKey = process.env.EVA_DEPLOY_KEY;
    if (!deployKey) {
      return new Response(
        "EVA_DEPLOY_KEY is not configured in Convex env vars",
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

http.route({
  path: "/api/sandbox/task-completion",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyDeployKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return new Response("Invalid request body", { status: 400 });
    }
    if (typeof body.taskId !== "string") {
      return new Response("taskId required", { status: 400 });
    }

    await ctx.runMutation(internal.taskWorkflow.handleScheduledCompletion, {
      taskId: body.taskId,
      success: typeof body.success === "boolean" ? body.success : false,
      result: typeof body.result === "string" ? body.result : null,
      error: typeof body.error === "string" ? body.error : null,
      activityLog:
        typeof body.activityLog === "string" ? body.activityLog : null,
    });
    return Response.json({ status: "ok" });
  }),
});

http.route({
  path: "/api/sandbox/task-proof",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyDeployKey(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return new Response("Invalid request body", { status: 400 });
    }
    if (typeof body.taskId !== "string") {
      return new Response("taskId required", { status: 400 });
    }

    if (
      typeof body.storageId === "string" &&
      typeof body.fileName === "string"
    ) {
      await ctx.runMutation(internal.taskProof.saveInternal, {
        taskId: body.taskId,
        storageId: body.storageId,
        fileName: body.fileName,
      });
      return Response.json({ status: "ok" });
    }

    if (typeof body.message === "string") {
      await ctx.runMutation(internal.taskProof.saveMessageInternal, {
        taskId: body.taskId,
        message: body.message,
      });
      return Response.json({ status: "ok" });
    }

    return new Response("Must provide storageId+fileName or message", {
      status: 400,
    });
  }),
});

const EXTENSION_ID = process.env.EXTENSION_ID ?? "conductor-extension";

http.route({
  path: "/api/updates/extension/updates.xml",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const release = await ctx.runQuery(
      internal.extensionReleases.getLatestInternal,
      {},
    );

    if (!release) {
      const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck status='noupdate' />
  </app>
</gupdate>`;
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    const siteUrl = process.env.CONVEX_SITE_URL ?? "";
    const crxUrl =
      release.crxUrl ?? `${siteUrl}/api/updates/extension/conductor.crx`;

    const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck codebase='${crxUrl}' version='${release.version}' />
  </app>
</gupdate>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache",
      },
    });
  }),
});

http.route({
  path: "/api/updates/extension/conductor.crx",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const release = await ctx.runQuery(
      internal.extensionReleases.getLatestInternal,
      {},
    );

    if (!release?.crxUrl) {
      return Response.json(
        { error: "No extension release found. Run ext:release first." },
        { status: 404 },
      );
    }

    return Response.redirect(release.crxUrl, 302);
  }),
});

export default http;
