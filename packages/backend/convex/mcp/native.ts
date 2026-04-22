import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const oauthMetadata = httpAction(async (_ctx, request) => {
  console.log("[MCP][oauthMetadata] request:", request.url);
  const baseUrl = new URL(request.url).origin;
  return Response.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/mcp/oauth/token`,
    registration_endpoint: `${baseUrl}/mcp/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
});

export const protectedResourceMetadata = httpAction(async (_ctx, request) => {
  console.log("[MCP][protectedResourceMetadata] request:", request.url);
  const baseUrl = new URL(request.url).origin;
  return Response.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ["header"],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Client Registration
// ─────────────────────────────────────────────────────────────────────────────

export const register = httpAction(async (ctx, request) => {
  try {
    console.log("[MCP][register] request received");
    const body = (await request.json()) as Record<string, unknown>;
    console.log(
      "[MCP][register] body redirect_uris:",
      JSON.stringify(body.redirect_uris),
    );
    const clientId = crypto.randomUUID();

    const rawUris = body.redirect_uris;
    const redirectUris: string[] = [];
    if (Array.isArray(rawUris)) {
      for (const uri of rawUris) {
        if (typeof uri === "string") {
          try {
            const parsed = new URL(uri);
            if (parsed.protocol === "http:" || parsed.protocol === "https:") {
              redirectUris.push(uri);
            }
          } catch {
            // Skip invalid URIs
          }
        }
      }
    }

    await ctx.runMutation(internal.mcp.oauth.registerClient, {
      clientId,
      redirectUris,
    });

    console.log(
      "[MCP][register] registered client:",
      clientId,
      "redirectUris:",
      redirectUris,
    );

    return Response.json(
      {
        ...body,
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        grant_types: body.grant_types ?? ["authorization_code"],
        response_types: body.response_types ?? ["code"],
        token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return Response.json({ error: message }, { status: 400 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Authorization
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const authorizeQuerySchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

export const authorizeGet = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const params = authorizeQuerySchema.parse(query);

    const client = await ctx.runQuery(internal.mcp.oauth.getClient, {
      clientId: params.client_id,
    });

    if (!client) {
      return new Response("<h1>Error</h1><p>Unknown client_id</p>", {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Get publishable key from action (runs in Node.js)
    const publishableKey = await ctx.runAction(
      internal.mcp.nodeActions.getClerkPublishableKey,
      {},
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Eva</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a; color: #fafafa;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh;
    }
    .container { width: 100%; max-width: 440px; text-align: center; padding: 24px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .subtitle { color: #a3a3a3; font-size: 14px; margin-bottom: 24px; }
    #sign-in-container { min-height: 300px; display: flex; justify-content: center; }
    .error { color: #ef4444; font-size: 14px; margin-top: 16px; display: none; }
    .loading { color: #a3a3a3; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign in to Eva</h1>
    <p class="subtitle">Sign in with your Eva account to connect Claude.</p>
    <div id="sign-in-container">
      <p class="loading">Loading...</p>
    </div>
    <p id="error-msg" class="error"></p>
    <form id="auth-form" method="POST" action="/mcp/oauth/authorize" style="display:none">
      <input type="hidden" name="client_id" value="${escapeHtml(params.client_id)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}" />
      <input type="hidden" name="clerk_token" id="clerk-token" value="" />
    </form>
  </div>
  <script>
    var PUBLISHABLE_KEY = ${JSON.stringify(publishableKey)};
    var keyParts = PUBLISHABLE_KEY.split('_');
    var keyPayload = keyParts.slice(2).join('_');
    var fapiUrl = atob(keyPayload).replace(/\\$$/, '');
    var script = document.createElement('script');
    script.src = 'https://' + fapiUrl + '/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-clerk-publishable-key', PUBLISHABLE_KEY);
    script.addEventListener('load', initClerk);
    document.head.appendChild(script);

    function initClerk() {
      var clerk = window.Clerk;
      if (!clerk) return;
      clerk.load().then(function() {
        if (clerk.session) {
          submitToken(clerk);
          return;
        }
        var container = document.getElementById('sign-in-container');
        container.innerHTML = '';
        clerk.mountSignIn(container, {
          afterSignInUrl: window.location.href,
          afterSignUpUrl: window.location.href,
          appearance: {
            variables: {
              colorBackground: '#171717',
              colorText: '#fafafa',
              colorPrimary: '#6366f1'
            }
          }
        });
        clerk.addListener(function(event) {
          if (event.session) submitToken(clerk);
        });
      });
    }

    function submitToken(clerk) {
      clerk.session.getToken().then(function(token) {
        document.getElementById('clerk-token').value = token;
        document.getElementById('auth-form').submit();
      });
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authorization failed";
    return new Response(`<h1>Error</h1><p>${message}</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }
});

export const authorizePost = httpAction(async (ctx, request) => {
  try {
    console.log("[MCP][authorizePost] received POST");
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        body[key] = value;
      }
    });

    console.log("[MCP][authorizePost] form fields:", {
      client_id: body.client_id,
      redirect_uri: body.redirect_uri,
      has_state: Boolean(body.state),
      has_code_challenge: Boolean(body.code_challenge),
      code_challenge_method: body.code_challenge_method,
      has_clerk_token: Boolean(body.clerk_token),
    });

    // Validate client exists and redirect_uri matches
    const client = await ctx.runQuery(internal.mcp.oauth.getClient, {
      clientId: body.client_id ?? "",
    });

    console.log(
      "[MCP][authorizePost] client lookup:",
      client
        ? { found: true, registeredRedirectUris: client.redirectUris }
        : { found: false },
    );

    if (!client) {
      throw new Error("Unknown client_id");
    }

    if (
      client.redirectUris.length > 0 &&
      !client.redirectUris.includes(body.redirect_uri ?? "")
    ) {
      console.log(
        "[MCP][authorizePost] redirect_uri mismatch. given:",
        body.redirect_uri,
        "registered:",
        client.redirectUris,
      );
      throw new Error("redirect_uri does not match registered URIs");
    }

    // Verify Clerk token and get user ID (runs in Node.js)
    const clerkUserId = await ctx.runAction(
      internal.mcp.nodeActions.verifyClerkTokenAction,
      { token: body.clerk_token ?? "" },
    );

    console.log(
      "[MCP][authorizePost] clerk verify result:",
      clerkUserId ? `userId=${clerkUserId}` : "null",
    );

    if (!clerkUserId) {
      throw new Error("Invalid Clerk token");
    }

    // Generate random code
    const codeBytes = new Uint8Array(32);
    crypto.getRandomValues(codeBytes);
    const code = Array.from(codeBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const CODE_TTL_MS = 5 * 60 * 1000;

    await ctx.runMutation(internal.mcp.oauth.storeAuthCode, {
      code,
      clerkUserId,
      codeChallenge: body.code_challenge ?? "",
      codeChallengeMethod: body.code_challenge_method ?? "",
      redirectUri: body.redirect_uri ?? "",
      clientId: body.client_id ?? "",
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    console.log("[MCP][authorizePost] stored auth code, redirecting");

    const redirectUrl = new URL(body.redirect_uri ?? "");
    redirectUrl.searchParams.set("code", code);
    redirectUrl.searchParams.set("state", body.state ?? "");

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authorization failed";
    console.error("[MCP][authorizePost] FAILED:", message);
    return new Response(`<h1>Error</h1><p>${message}</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Token Exchange
// ─────────────────────────────────────────────────────────────────────────────

const authCodeBodySchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string(),
  redirect_uri: z.string(),
  code_verifier: z.string(),
  client_id: z.string(),
});

const refreshBodySchema = z.object({
  grant_type: z.literal("refresh_token"),
  refresh_token: z.string(),
  client_id: z.string(),
});

export const token = httpAction(async (ctx, request) => {
  console.log("[MCP][token] received POST");
  const contentType = request.headers.get("Content-Type") ?? "";
  let body: Record<string, string>;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    body = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        body[key] = value;
      }
    });
  } else {
    try {
      body = (await request.json()) as Record<string, string>;
    } catch (err) {
      console.error("[MCP][token] failed to parse JSON body:", err);
      return Response.json(
        { error: "invalid_request", error_description: "Invalid request body" },
        { status: 400 },
      );
    }
  }

  console.log(
    "[MCP][token] grant_type:",
    body.grant_type,
    "client_id:",
    body.client_id,
  );

  // Handle refresh token
  const refreshParse = refreshBodySchema.safeParse(body);
  if (refreshParse.success) {
    console.log("[MCP][token] handling refresh_token grant");
    const result = await ctx.runAction(internal.mcp.nodeActions.refreshToken, {
      refreshToken: refreshParse.data.refresh_token,
    });
    if (!result.success) {
      console.error("[MCP][token] refresh failed:", result.error);
      return Response.json(
        { error: "invalid_grant", error_description: result.error },
        { status: 400 },
      );
    }
    console.log("[MCP][token] refresh success");
    return Response.json(result.tokens);
  }

  // Handle authorization code
  const parseResult = authCodeBodySchema.safeParse(body);
  if (!parseResult.success) {
    console.error(
      "[MCP][token] invalid request body. keys:",
      Object.keys(body),
      "issues:",
      parseResult.error.issues,
    );
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing or invalid parameters",
      },
      { status: 400 },
    );
  }
  const params = parseResult.data;
  console.log("[MCP][token] parsed auth_code params OK, consuming code");

  const entry = await ctx.runMutation(internal.mcp.oauth.consumeAuthCode, {
    code: params.code,
  });

  if (!entry) {
    console.error("[MCP][token] auth code not found or expired");
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      },
      { status: 400 },
    );
  }

  console.log(
    "[MCP][token] consumed auth code for clerkUserId:",
    entry.clerkUserId,
  );

  if (entry.redirectUri !== params.redirect_uri) {
    console.error(
      "[MCP][token] redirect_uri mismatch. stored:",
      entry.redirectUri,
      "given:",
      params.redirect_uri,
    );
    return Response.json(
      { error: "invalid_grant", error_description: "Redirect URI mismatch" },
      { status: 400 },
    );
  }

  // Verify PKCE using Web Crypto
  const encoder = new TextEncoder();
  const data = encoder.encode(params.code_verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  const expectedChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  if (expectedChallenge !== entry.codeChallenge) {
    console.error(
      "[MCP][token] PKCE failed. expected:",
      expectedChallenge,
      "stored:",
      entry.codeChallenge,
    );
    return Response.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 },
    );
  }

  console.log("[MCP][token] PKCE OK, issuing tokens");

  // Issue tokens (runs in Node.js)
  const tokens = await ctx.runAction(internal.mcp.nodeActions.issueTokens, {
    clerkUserId: entry.clerkUserId,
  });

  console.log("[MCP][token] tokens issued OK");
  return Response.json(tokens);
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP Endpoint
// ─────────────────────────────────────────────────────────────────────────────

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0]?.toLowerCase() !== "bearer") return null;
  return parts[1] ?? null;
}

export const mcpHandler = httpAction(async (ctx, request) => {
  const baseUrl = new URL(request.url).origin;
  const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;

  console.log("[MCP][mcpHandler] request:", request.method, request.url);

  // Auth check
  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) {
    console.error("[MCP][mcpHandler] missing Authorization header");
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
        },
      },
    );
  }

  console.log("[MCP][mcpHandler] verifying access token");
  const credentials = await ctx.runAction(
    internal.mcp.nodeActions.verifyAccessToken,
    {
      token,
    },
  );

  if (!credentials) {
    console.error("[MCP][mcpHandler] token verification failed");
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
      },
    });
  }

  console.log(
    "[MCP][mcpHandler] token OK. clerkUserId:",
    credentials.clerkUserId,
    "scopedRepoId:",
    credentials.scopedRepoId,
  );

  // Handle unsupported methods
  if (request.method === "GET" || request.method === "DELETE") {
    console.log("[MCP][mcpHandler] method not supported:", request.method);
    return Response.json(
      { error: "Method not supported in stateless mode" },
      { status: 405 },
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error("[MCP][mcpHandler] failed to parse JSON body:", err);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(
    "[MCP][mcpHandler] delegating to handleMcpRequest. body preview:",
    JSON.stringify(body).slice(0, 200),
  );

  // Delegate to Node.js action for MCP protocol handling
  // The MCP SDK requires Node.js runtime
  const result = await ctx.runAction(
    internal.mcp.nodeActions.handleMcpRequest,
    {
      clerkUserId: credentials.clerkUserId,
      scopedRepoId: credentials.scopedRepoId,
      body: JSON.stringify(body),
    },
  );

  console.log(
    "[MCP][mcpHandler] handleMcpRequest returned status:",
    result.status,
    "body preview:",
    result.body.slice(0, 200),
  );

  return new Response(result.body, {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal Token Minting (for scoped repo access)
// ─────────────────────────────────────────────────────────────────────────────

export const mintInternalToken = httpAction(async (ctx, request) => {
  // Verify bootstrap secret
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("MCPBootstrap ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bootstrapSecret = auth.slice("MCPBootstrap ".length);

  const bodyRaw = await request.json();
  if (typeof bodyRaw !== "object" || bodyRaw === null) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = bodyRaw as Record<string, unknown>;
  const clerkUserId = body.clerkUserId;
  const repoId = body.repoId;

  if (typeof clerkUserId !== "string" || typeof repoId !== "string") {
    return Response.json(
      { error: "clerkUserId and repoId required" },
      { status: 400 },
    );
  }

  // Delegate to Node.js action (which has access to MCP_INTERNAL_SECRET)
  const result = await ctx.runAction(
    internal.mcp.nodeActions.mintInternalToken,
    {
      clerkUserId,
      repoId,
      bootstrapSecret,
    },
  );

  if (!result) {
    return Response.json({ error: "Invalid credentials" }, { status: 403 });
  }

  return Response.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────────────

export const health = httpAction(async () => {
  return Response.json({ status: "ok" });
});
