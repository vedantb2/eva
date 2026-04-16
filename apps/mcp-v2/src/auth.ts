import crypto from "node:crypto";
import {
  createClerkClient,
  verifyToken as verifyClerkToken,
} from "@clerk/backend";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { verifyInternalToken } from "./internal-auth.js";

export interface ConvexCredentials {
  convexUrl: string;
  clerkUserId: string;
  scopedRepoId?: string;
}

const CODE_TTL_MS = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Environment helpers
// ─────────────────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.MCP_JWT_SECRET;
  if (!secret) {
    throw new Error("MCP_JWT_SECRET environment variable is required");
  }
  return secret;
}

function getClerkPublishableKey(): string {
  const key = process.env.CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("CLERK_PUBLISHABLE_KEY environment variable is required");
  }
  return key;
}

function getClerkSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    throw new Error("CLERK_SECRET_KEY environment variable is required");
  }
  return key;
}

function getConvexUrl(): string {
  const convexUrl = process.env.CONVEX_CLOUD_URL;
  if (!convexUrl) {
    throw new Error("CONVEX_CLOUD_URL environment variable is required");
  }
  return convexUrl.replace(/\/$/, "");
}

function getDeployKey(): string {
  const key = process.env.EVA_DEPLOY_KEY;
  if (!key) {
    throw new Error("EVA_DEPLOY_KEY environment variable is required");
  }
  return key;
}

/** Convex HTTP actions are served at .convex.site, not .convex.cloud. */
function toSiteUrl(convexUrl: string): string {
  return convexUrl.replace(/\.convex\.cloud$/, ".convex.site");
}

// ─────────────────────────────────────────────────────────────────────────────
// Convex OAuth State API calls
// ─────────────────────────────────────────────────────────────────────────────

interface ConvexClient {
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  registeredAt: number;
}

async function convexRegisterClient(
  clientId: string,
  redirectUris: string[],
): Promise<void> {
  const response = await fetch(
    `${toSiteUrl(getConvexUrl())}/api/mcp/oauth/clients`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${getDeployKey()}`,
      },
      body: JSON.stringify({ clientId, redirectUris }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to register client: ${response.status}`);
  }
}

async function convexGetClient(clientId: string): Promise<ConvexClient | null> {
  const response = await fetch(
    `${toSiteUrl(getConvexUrl())}/api/mcp/oauth/clients/${encodeURIComponent(clientId)}`,
    {
      method: "GET",
      headers: { Authorization: `Convex ${getDeployKey()}` },
    },
  );
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to get client: ${response.status}`);
  }
  const body = await response.json();
  const parsed = z
    .object({
      found: z.boolean(),
      client: z
        .object({
          clientId: z.string(),
          clientSecret: z.string().optional(),
          redirectUris: z.array(z.string()),
          registeredAt: z.number(),
        })
        .optional(),
    })
    .parse(body);
  if (!parsed.found || !parsed.client) return null;
  return parsed.client;
}

interface ConvexAuthCodeEntry {
  clerkUserId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri: string;
  clientId: string;
}

async function convexStoreAuthCode(
  code: string,
  entry: {
    clerkUserId: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    redirectUri: string;
    clientId: string;
    expiresAt: number;
  },
): Promise<void> {
  const response = await fetch(
    `${toSiteUrl(getConvexUrl())}/api/mcp/oauth/auth-codes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Convex ${getDeployKey()}`,
      },
      body: JSON.stringify({ code, ...entry }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to store auth code: ${response.status}`);
  }
}

async function convexConsumeAuthCode(
  code: string,
): Promise<ConvexAuthCodeEntry | null> {
  const response = await fetch(
    `${toSiteUrl(getConvexUrl())}/api/mcp/oauth/auth-codes/${encodeURIComponent(code)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Convex ${getDeployKey()}` },
    },
  );
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to consume auth code: ${response.status}`);
  }
  const body = await response.json();
  const parsed = z
    .object({
      found: z.boolean(),
      entry: z
        .object({
          clerkUserId: z.string(),
          codeChallenge: z.string(),
          codeChallengeMethod: z.string(),
          redirectUri: z.string(),
          clientId: z.string(),
        })
        .optional(),
    })
    .parse(body);
  if (!parsed.found || !parsed.entry) return null;
  return parsed.entry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clerk helpers
// ─────────────────────────────────────────────────────────────────────────────

async function verifyClerkUserExists(clerkUserId: string): Promise<boolean> {
  try {
    const clerk = createClerkClient({ secretKey: getClerkSecretKey() });
    await clerk.users.getUser(clerkUserId);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Metadata
// ─────────────────────────────────────────────────────────────────────────────

export function getOAuthMetadata(baseUrl: string) {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  };
}

export function getProtectedResourceMetadata(baseUrl: string) {
  return {
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ["header"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Registration
// ─────────────────────────────────────────────────────────────────────────────

export async function handleClientRegistration(
  requestBody: Record<string, unknown>,
) {
  const clientId = crypto.randomUUID();

  const rawUris = requestBody.redirect_uris;
  const redirectUris: string[] = [];
  if (Array.isArray(rawUris)) {
    for (const uri of rawUris) {
      if (typeof uri === "string" && validateRedirectUri(uri)) {
        redirectUris.push(uri);
      }
    }
  }

  await convexRegisterClient(clientId, redirectUris);

  return {
    ...requestBody,
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    grant_types: requestBody.grant_types ?? ["authorization_code"],
    response_types: requestBody.response_types ?? ["code"],
    token_endpoint_auth_method:
      requestBody.token_endpoint_auth_method ?? "none",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Authorization Page
// ─────────────────────────────────────────────────────────────────────────────

const authorizeQuerySchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function renderAuthPage(
  query: Record<string, string>,
): Promise<string> {
  const params = authorizeQuerySchema.parse(query);

  const client = await convexGetClient(params.client_id);
  if (!client) {
    throw new Error("Unknown client_id. Register via /oauth/register first.");
  }
  if (
    client.redirectUris.length > 0 &&
    !client.redirectUris.includes(params.redirect_uri)
  ) {
    throw new Error(
      "redirect_uri does not match registered URIs for this client",
    );
  }

  const publishableKey = getClerkPublishableKey();

  return `<!DOCTYPE html>
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
    <form id="auth-form" method="POST" action="/oauth/authorize" style="display:none">
      <input type="hidden" name="client_id" value="${escapeHtml(params.client_id)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}" />
      <input type="hidden" name="clerk_token" id="clerk-token" value="" />
    </form>
  </div>
  <script>
    sessionStorage.setItem('mcp_oauth_return_url', window.location.href);

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
    script.addEventListener('error', function() {
      showError('Failed to load authentication. Please try again.');
    });
    document.head.appendChild(script);

    function initClerk() {
      var clerk = window.Clerk;
      if (!clerk) {
        showError('Failed to initialize authentication.');
        return;
      }

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
              colorPrimary: '#6366f1',
              colorInputBackground: '#0a0a0a',
              colorInputText: '#fafafa'
            }
          }
        });

        clerk.addListener(function(event) {
          if (event.session) {
            clerk.unmountSignIn(container);
            container.innerHTML = '<p class="loading">Connecting...</p>';
            submitToken(clerk);
          }
        });
      }).catch(function() {
        showError('Failed to load sign-in. Please try again.');
      });
    }

    function submitToken(clerk) {
      clerk.session.getToken().then(function(token) {
        if (!token) {
          showError('Failed to get session token. Please try again.');
          return;
        }
        document.getElementById('clerk-token').value = token;
        document.getElementById('auth-form').submit();
      }).catch(function() {
        showError('Authentication failed. Please try again.');
      });
    }

    function showError(msg) {
      var el = document.getElementById('error-msg');
      el.textContent = msg;
      el.style.display = 'block';
    }
  </script>
</body>
</html>`;
}

export function renderHandshakePage(publishableKey: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting...</p>
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
    script.addEventListener('load', function() {
      var clerk = window.Clerk;
      if (!clerk) { fallback(); return; }
      clerk.load().then(function() {
        var returnUrl = sessionStorage.getItem('mcp_oauth_return_url');
        if (returnUrl) {
          sessionStorage.removeItem('mcp_oauth_return_url');
          window.location.href = returnUrl;
        } else {
          fallback();
        }
      }).catch(fallback);
    });
    script.addEventListener('error', fallback);
    document.head.appendChild(script);

    function fallback() {
      document.body.textContent = 'Authentication handshake failed. Please try connecting again from Claude.';
    }
  </script>
</body>
</html>`;
}

function validateRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clerk Auth Processing
// ─────────────────────────────────────────────────────────────────────────────

const clerkAuthBodySchema = z.object({
  clerk_token: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

export async function processClerkAuth(
  body: Record<string, string>,
): Promise<string> {
  const params = clerkAuthBodySchema.parse(body);

  if (!validateRedirectUri(params.redirect_uri)) {
    throw new Error("Invalid redirect URI");
  }

  const client = await convexGetClient(params.client_id);
  if (!client) {
    throw new Error("Unknown client_id. Register via /oauth/register first.");
  }
  if (
    client.redirectUris.length > 0 &&
    !client.redirectUris.includes(params.redirect_uri)
  ) {
    throw new Error(
      "redirect_uri does not match registered URIs for this client",
    );
  }

  const clerkPayload = await verifyClerkToken(params.clerk_token, {
    secretKey: getClerkSecretKey(),
  });

  const parsed = z.object({ sub: z.string() }).safeParse(clerkPayload);
  if (!parsed.success) {
    throw new Error("Invalid Clerk token: missing user ID");
  }

  const clerkUserId = parsed.data.sub;

  const code = crypto.randomBytes(32).toString("hex");
  await convexStoreAuthCode(code, {
    clerkUserId,
    codeChallenge: params.code_challenge,
    codeChallengeMethod: params.code_challenge_method,
    redirectUri: params.redirect_uri,
    clientId: params.client_id,
    expiresAt: Date.now() + CODE_TTL_MS,
  });

  const redirectUrl = new URL(params.redirect_uri);
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", params.state);
  return redirectUrl.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Exchange
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

interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token: string;
}

interface TokenError {
  error: string;
  error_description: string;
}

type TokenResult =
  | { ok: true; response: TokenResponse }
  | { ok: false; error: TokenError };

function issueTokens(clerkUserId: string): TokenResponse {
  const accessToken = jwt.sign({ sub: clerkUserId }, getJwtSecret(), {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(
    { sub: clerkUserId, type: "refresh" },
    getJwtSecret(),
    { expiresIn: "30d" },
  );
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "claudeai",
    refresh_token: refreshToken,
  };
}

export async function exchangeToken(
  body: Record<string, string>,
): Promise<TokenResult> {
  const refreshParse = refreshBodySchema.safeParse(body);
  if (refreshParse.success) {
    return handleRefreshToken(refreshParse.data.refresh_token);
  }

  const parseResult = authCodeBodySchema.safeParse(body);
  if (!parseResult.success) {
    return {
      ok: false,
      error: {
        error: "invalid_request",
        error_description: "Missing or invalid parameters",
      },
    };
  }
  const params = parseResult.data;

  const client = await convexGetClient(params.client_id);
  if (!client) {
    return {
      ok: false,
      error: {
        error: "invalid_client",
        error_description: "Unknown client_id",
      },
    };
  }

  const entry = await convexConsumeAuthCode(params.code);
  if (!entry) {
    return {
      ok: false,
      error: {
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      },
    };
  }

  if (entry.redirectUri !== params.redirect_uri) {
    return {
      ok: false,
      error: {
        error: "invalid_grant",
        error_description: "Redirect URI mismatch",
      },
    };
  }

  const expectedChallenge = crypto
    .createHash("sha256")
    .update(params.code_verifier)
    .digest("base64url");

  if (expectedChallenge !== entry.codeChallenge) {
    return {
      ok: false,
      error: {
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      },
    };
  }

  return { ok: true, response: issueTokens(entry.clerkUserId) };
}

const refreshTokenPayloadSchema = z.object({
  sub: z.string(),
  type: z.literal("refresh"),
});

function handleRefreshToken(token: string): TokenResult {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const payload = refreshTokenPayloadSchema.safeParse(decoded);
    if (!payload.success) {
      return {
        ok: false,
        error: {
          error: "invalid_grant",
          error_description: "Invalid refresh token",
        },
      };
    }
    return { ok: true, response: issueTokens(payload.data.sub) };
  } catch {
    return {
      ok: false,
      error: {
        error: "invalid_grant",
        error_description: "Expired or invalid refresh token",
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Verification
// ─────────────────────────────────────────────────────────────────────────────

const mcpTokenPayloadSchema = z.object({ sub: z.string() });

async function verifyOAuthToken(
  token: string,
): Promise<ConvexCredentials | null> {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const payload = mcpTokenPayloadSchema.safeParse(decoded);
    if (!payload.success) return null;
    const clerkUserId = payload.data.sub;
    const userExists = await verifyClerkUserExists(clerkUserId);
    if (!userExists) return null;
    return { convexUrl: getConvexUrl(), clerkUserId };
  } catch {
    return null;
  }
}

export async function verifyToken(
  token: string,
): Promise<ConvexCredentials | null> {
  const oauthResult = await verifyOAuthToken(token);
  if (oauthResult) return oauthResult;
  return verifyInternalToken(token);
}

export function extractBearerToken(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;
  const scheme = parts[0];
  const token = parts[1];
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token;
}
