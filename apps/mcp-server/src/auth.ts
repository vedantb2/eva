import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

export interface ConvexCredentials {
  convexUrl: string;
  deployKey: string;
}

interface AuthCodeEntry {
  convexUrl: string;
  deployKey: string;
  codeChallenge: string;
  redirectUri: string;
  expiresAt: number;
}

interface TokenStoreEntry {
  credentials: ConvexCredentials;
  expiresAt: number;
}

const authCodeStore = new Map<string, AuthCodeEntry>();
const tokenStore = new Map<string, TokenStoreEntry>();

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of authCodeStore) {
    if (entry.expiresAt < now) {
      authCodeStore.delete(code);
    }
  }
  for (const [id, entry] of tokenStore) {
    if (entry.expiresAt < now) {
      tokenStore.delete(id);
    }
  }
}, 60_000);

function getJwtSecret(): string {
  const secret = process.env.MCP_JWT_SECRET;
  if (!secret) {
    throw new Error("MCP_JWT_SECRET environment variable is required");
  }
  return secret;
}

export function getOAuthMetadata(baseUrl: string) {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
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

export function handleClientRegistration(requestBody: Record<string, unknown>) {
  const clientId = crypto.randomUUID();
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

const authorizeQuerySchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

export function renderAuthForm(query: Record<string, string>): string {
  const params = authorizeQuerySchema.parse(query);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect Convex Deployment</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fafafa; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 32px; width: 100%; max-width: 420px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .subtitle { color: #a3a3a3; font-size: 14px; margin-bottom: 24px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #d4d4d4; margin-bottom: 6px; }
    input[type="text"], input[type="password"] { width: 100%; padding: 10px 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 8px; color: #fafafa; font-size: 14px; margin-bottom: 16px; outline: none; }
    input:focus { border-color: #6366f1; }
    .help { font-size: 12px; color: #737373; margin-top: -12px; margin-bottom: 16px; }
    button { width: 100%; padding: 10px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect Convex Deployment</h1>
    <p class="subtitle">Enter your Convex deployment credentials to allow Claude to query your data.</p>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(params.client_id)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}" />
      <label for="convex_url">Deployment URL</label>
      <input type="text" id="convex_url" name="convex_url" placeholder="https://your-project-123.convex.cloud" required />
      <p class="help">Find this in your Convex dashboard under Settings &rarr; URL.</p>
      <label for="deploy_key">Deploy Key</label>
      <input type="password" id="deploy_key" name="deploy_key" placeholder="prod:abc123..." required />
      <p class="help">Generate one in Settings &rarr; Deploy Keys. Use a "read-only" key for safety.</p>
      <button type="submit">Connect</button>
    </form>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderRedirectPage(redirectUrl: string): string {
  const safeUrl = escapeHtml(redirectUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting…</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #a3a3a3; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    p { font-size: 14px; }
  </style>
</head>
<body>
  <p>Connecting… this window should close automatically.</p>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
  <noscript><meta http-equiv="refresh" content="0;url=${safeUrl}" /></noscript>
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

const formBodySchema = z.object({
  convex_url: z.string(),
  deploy_key: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
});

export function processAuthForm(body: Record<string, string>): string {
  const params = formBodySchema.parse(body);

  if (!validateRedirectUri(params.redirect_uri)) {
    throw new Error("Invalid redirect URI");
  }

  const code = crypto.randomBytes(32).toString("hex");
  authCodeStore.set(code, {
    convexUrl: params.convex_url.replace(/\/$/, ""),
    deployKey: params.deploy_key,
    codeChallenge: params.code_challenge,
    redirectUri: params.redirect_uri,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  const redirectUrl = new URL(params.redirect_uri);
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", params.state);
  return redirectUrl.toString();
}

const tokenBodySchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string(),
  redirect_uri: z.string(),
  code_verifier: z.string(),
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

export function exchangeToken(body: Record<string, string>): TokenResult {
  const parseResult = tokenBodySchema.safeParse(body);
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

  const entry = authCodeStore.get(params.code);
  if (!entry || entry.expiresAt < Date.now()) {
    authCodeStore.delete(params.code);
    return {
      ok: false,
      error: {
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      },
    };
  }

  authCodeStore.delete(params.code);

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

  const tokenId = crypto.randomBytes(32).toString("hex");
  const refreshTokenId = crypto.randomBytes(32).toString("hex");
  const credentials = {
    convexUrl: entry.convexUrl,
    deployKey: entry.deployKey,
  };
  tokenStore.set(tokenId, {
    credentials,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  tokenStore.set(refreshTokenId, {
    credentials,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  const accessToken = jwt.sign({ tid: tokenId }, getJwtSecret(), {
    expiresIn: "30d",
  });
  const refreshToken = jwt.sign({ tid: refreshTokenId }, getJwtSecret(), {
    expiresIn: "90d",
  });

  return {
    ok: true,
    response: {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 30 * 24 * 60 * 60,
      scope: "claudeai",
      refresh_token: refreshToken,
    },
  };
}

const tokenPayloadSchema = z.object({ tid: z.string() });

export function verifyToken(token: string): ConvexCredentials | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const payload = tokenPayloadSchema.safeParse(decoded);
    if (!payload.success) return null;

    const entry = tokenStore.get(payload.data.tid);
    if (!entry || entry.expiresAt < Date.now()) {
      tokenStore.delete(payload.data.tid);
      return null;
    }
    return entry.credentials;
  } catch {
    return null;
  }
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
