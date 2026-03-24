import { httpRouter } from "convex/server";
import { createClerkClient } from "@clerk/backend";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { SANDBOX_JWT_ISSUER } from "./sandboxAuthConfig";

const http = httpRouter();

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  let mismatch = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    mismatch |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return mismatch === 0;
}

function verifyMcpBootstrapToken(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const expected = process.env.MCP_BOOTSTRAP_SECRET;
  if (!expected) return false;
  return timingSafeEqual(auth, `MCPBootstrap ${expected}`);
}

function verifyDeployKey(request: Request): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const expected = process.env.EVA_DEPLOY_KEY;
  if (!expected) return false;
  return timingSafeEqual(auth, `Convex ${expected}`);
}

function parseEnvVarsBody(
  body: unknown,
): { repoId: string; userId: string } | null {
  if (typeof body !== "object" || body === null) return null;
  if (!("repoId" in body) || typeof body.repoId !== "string") return null;
  if (!("userId" in body) || typeof body.userId !== "string") return null;
  if (body.repoId.length === 0 || body.userId.length === 0) return null;
  return { repoId: body.repoId, userId: body.userId };
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
    const parsed = parseEnvVarsBody(body);
    if (!parsed) {
      return new Response("Invalid request body: repoId and userId required", {
        status: 400,
      });
    }

    const hasAccess: boolean = await ctx.runQuery(
      internal.mcpQueries.checkRepoAccessForUser,
      { repoId: parsed.repoId, userId: parsed.userId },
    );
    if (!hasAccess) {
      return new Response("Access denied", { status: 403 });
    }

    const vars = await ctx.runAction(
      internal.mcpRoutes.getDecryptedRepoEnvVars,
      { repoId: parsed.repoId },
    );
    return Response.json(vars);
  }),
});

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    const siteUrl = SANDBOX_JWT_ISSUER;
    return new Response(
      JSON.stringify({
        issuer: siteUrl,
        jwks_uri: `${siteUrl}/.well-known/jwks.json`,
        id_token_signing_alg_values_supported: ["ES256"],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    const jwks = process.env.SANDBOX_JWT_JWKS;
    if (!jwks) {
      return new Response("SANDBOX_JWT_JWKS not configured", { status: 500 });
    }
    return new Response(jwks, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  return typeof val === "string" ? val : null;
}

function getBoolean(obj: Record<string, unknown>, key: string): boolean | null {
  const val = obj[key];
  return typeof val === "boolean" ? val : null;
}

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed =
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return timingSafeEqual(computed, signature);
}

http.route({
  path: "/api/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("X-Hub-Signature-256");
    const event = request.headers.get("X-GitHub-Event");
    const body = await request.text();

    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("GITHUB_WEBHOOK_SECRET not configured", {
        status: 500,
      });
    }

    if (
      !signature ||
      !(await verifyWebhookSignature(body, signature, secret))
    ) {
      return new Response("Invalid signature", { status: 401 });
    }

    if (event === "pull_request") {
      const payload: unknown = JSON.parse(body);
      if (!isRecord(payload)) {
        return new Response("OK", { status: 200 });
      }

      const action = getString(payload, "action");
      if (action !== "closed") {
        return new Response("OK", { status: 200 });
      }

      const pullRequest = payload["pull_request"];
      if (!isRecord(pullRequest)) {
        return new Response("OK", { status: 200 });
      }

      const prUrl = getString(pullRequest, "html_url");
      const merged = getBoolean(pullRequest, "merged");
      if (!prUrl || merged === null) {
        return new Response("OK", { status: 200 });
      }

      await ctx.scheduler.runAfter(0, internal.githubWebhook.handlePrClosed, {
        prUrl,
        merged,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/api/auth/agent-login",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const agentUserId = process.env.AGENT_CLERK_USER_ID;

    if (!clerkSecretKey || !agentUserId) {
      return Response.json(
        {
          error: "CLERK_SECRET_KEY and AGENT_CLERK_USER_ID must be configured",
        },
        { status: 500 },
      );
    }

    const origin =
      request.headers.get("Origin") ||
      request.headers.get("Referer")?.replace(/\/$/, "") ||
      null;

    if (!origin) {
      return Response.json(
        { error: "Could not determine callback origin" },
        { status: 400 },
      );
    }

    const clerk = createClerkClient({ secretKey: clerkSecretKey });

    const { token } = await clerk.signInTokens.createSignInToken({
      userId: agentUserId,
      expiresInSeconds: 60,
    });

    const callbackUrl = new URL("/agent-callback", origin);
    callbackUrl.searchParams.set("ticket", token);

    return Response.redirect(callbackUrl.toString(), 302);
  }),
});

export default http;
