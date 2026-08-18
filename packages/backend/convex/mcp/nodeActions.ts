"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { createClerkClient } from "@clerk/backend";
import { jwtVerify, SignJWT, importJWK } from "jose";
import { z } from "zod";
import { internal } from "../_generated/api";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools } from "./tools";
import { registerSupabaseTools } from "./supabase";
import { resolveAgentDelivery } from "./orchestratorDelivery";
import { TASK_CHAT_STREAM_PREFIX } from "../_chat/surfaceAdapters";
import { normalizeAIModel } from "../validators";

// ─────────────────────────────────────────────────────────────────────────────
// Environment Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.MCP_JWT_SECRET;
  if (!secret) throw new Error("MCP_JWT_SECRET is required");
  return secret;
}

function getClerkSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("CLERK_SECRET_KEY is required");
  return key;
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT Claim Schemas (boundary parsing for verified payloads)
// ─────────────────────────────────────────────────────────────────────────────

const refreshTokenClaims = z.object({
  sub: z.string(),
  type: z.literal("refresh"),
  clientId: z.string(),
  iss: z.literal("eva"),
  aud: z.literal("mcp-oauth"),
});

const oauthTokenClaims = z.object({
  sub: z.string(),
  clientId: z.string(),
  iss: z.literal("eva"),
  aud: z.literal("mcp-oauth"),
});

const internalTokenClaims = z.object({
  sub: z.string(),
  iss: z.literal("eva"),
  aud: z.literal("mcp-internal"),
  repoId: z.string(),
  entityId: z.string().optional(),
  entityKind: z.enum(["session", "task", "project"]).optional(),
  orchestrator: z.boolean().optional(),
});

type OauthTokens = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token: string;
};

type RefreshResult =
  | { success: true; tokens: OauthTokens }
  | { success: false; error: string };

function refreshFailure(error: string): RefreshResult {
  return { success: false, error };
}

function refreshSuccess(tokens: OauthTokens): RefreshResult {
  return { success: true, tokens };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Actions
// ─────────────────────────────────────────────────────────────────────────────

async function createOauthTokens(
  clerkUserId: string,
  clientId: string,
  secret: Uint8Array,
): Promise<OauthTokens> {
  const accessToken = await new SignJWT({ sub: clerkUserId, clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("eva")
    .setAudience("mcp-oauth")
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(secret);

  const refreshToken = await new SignJWT({
    sub: clerkUserId,
    clientId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("eva")
    .setAudience("mcp-oauth")
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(secret);

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "claudeai",
    refresh_token: refreshToken,
  };
}

export const issueTokens = internalAction({
  args: { clerkUserId: v.string(), clientId: v.string() },
  returns: v.object({
    access_token: v.string(),
    token_type: v.literal("Bearer"),
    expires_in: v.number(),
    scope: v.string(),
    refresh_token: v.string(),
  }),
  handler: async (_ctx, { clerkUserId, clientId }) => {
    const secret = new TextEncoder().encode(getJwtSecret());
    return await createOauthTokens(clerkUserId, clientId, secret);
  },
});

export const refreshToken = internalAction({
  args: { refreshToken: v.string(), clientId: v.string() },
  returns: v.union(
    v.object({
      success: v.literal(true),
      tokens: v.object({
        access_token: v.string(),
        token_type: v.literal("Bearer"),
        expires_in: v.number(),
        scope: v.string(),
        refresh_token: v.string(),
      }),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    }),
  ),
  handler: async (_ctx, { refreshToken, clientId }) => {
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jwtVerify(refreshToken, secret, {
        issuer: "eva",
        audience: "mcp-oauth",
      });

      const claims = refreshTokenClaims.safeParse(payload);
      if (!claims.success || claims.data.clientId !== clientId) {
        return refreshFailure("Invalid refresh token");
      }

      const clerk = createClerkClient({ secretKey: getClerkSecretKey() });
      await clerk.users.getUser(claims.data.sub);
      const tokens = await createOauthTokens(
        claims.data.sub,
        clientId,
        secret,
      );

      return refreshSuccess(tokens);
    } catch {
      return refreshFailure("Expired or invalid refresh token");
    }
  },
});

export const verifyAccessToken = internalAction({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      clerkUserId: v.string(),
      scopedRepoId: v.optional(v.string()),
      entityId: v.optional(v.string()),
      entityKind: v.optional(
        v.union(v.literal("session"), v.literal("task"), v.literal("project")),
      ),
      isOrchestrator: v.optional(v.boolean()),
    }),
    v.null(),
  ),
  handler: async (_ctx, { token }) => {
    // Try OAuth token first
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jwtVerify(token, secret, {
        issuer: "eva",
        audience: "mcp-oauth",
      });

      const claims = oauthTokenClaims.safeParse(payload);
      if (claims.success) {
        // Best-effort Clerk lookup — agent/test users may not exist in Clerk but
        // a verified JWT sub is still authoritative for MCP auth.
        try {
          const clerk = createClerkClient({ secretKey: getClerkSecretKey() });
          await clerk.users.getUser(claims.data.sub);
        } catch (err) {
          console.error(
            "[MCP][verifyAccessToken] Clerk getUser failed (using JWT sub):",
            err instanceof Error ? err.message : err,
          );
          return null;
        }
        // Same shape as internal tokens so callers can read optional fields
        // without narrowing (OAuth tokens just leave them unset).
        return {
          clerkUserId: claims.data.sub,
          scopedRepoId: undefined,
          entityId: undefined,
          entityKind: undefined,
          isOrchestrator: undefined,
        };
      }
      // OAuth payload missing sub — fall through to internal token
    } catch {
      // Not an OAuth token — fall through to internal token
    }

    // Try internal token (scoped repo access)
    try {
      const internalSecret = process.env.MCP_INTERNAL_SECRET;
      if (!internalSecret) {
        console.error("[MCP][verifyAccessToken] MCP_INTERNAL_SECRET not set");
        return null;
      }

      const secret = new TextEncoder().encode(internalSecret);
      const { payload } = await jwtVerify(token, secret);

      // Validate internal token structure
      const claims = internalTokenClaims.safeParse(payload);
      if (!claims.success) {
        console.error(
          "[MCP][verifyAccessToken] internal token payload invalid",
        );
        return null;
      }

      return {
        clerkUserId: claims.data.sub,
        scopedRepoId: claims.data.repoId,
        ...(claims.data.entityId !== undefined
          ? { entityId: claims.data.entityId }
          : {}),
        ...(claims.data.entityKind !== undefined
          ? { entityKind: claims.data.entityKind }
          : {}),
        ...(claims.data.orchestrator !== undefined
          ? { isOrchestrator: claims.data.orchestrator }
          : {}),
      };
    } catch (err) {
      console.error(
        "[MCP][verifyAccessToken] all verification failed:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Convex API Helpers (for calling target Convex deployments)
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

const convexSuccessResponse = z.object({
  status: z.literal("success"),
  value: jsonValue,
  logLines: z.array(z.string()).optional(),
});

const convexErrorResponse = z.object({
  status: z.literal("error"),
  errorMessage: z.string(),
});

const convexResponse = z.union([convexSuccessResponse, convexErrorResponse]);

function authHeaders(deployKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Convex ${deployKey}`,
  };
}

function parseConvexResponse(json: JsonValue) {
  const result = convexResponse.parse(json);
  if (result.status === "error") {
    throw new Error(result.errorMessage);
  }
  return result;
}

function wrapQueryHandler(handlerBody: string): string {
  return [
    'import { query } from "convex:/_system/repl/wrappers.js";',
    "",
    "export default query({",
    "  handler: async (ctx) => {",
    `    ${handlerBody}`,
    "  },",
    "});",
  ].join("\n");
}

// In-memory caches (reset on action cold starts)
let cachedDeployKey: { value: string; expiresAt: number } | null = null;
const userIdCache = new Map<string, { userId: string; expiresAt: number }>();
const repoCredentialsCache = new Map<
  string,
  { convexUrl: string; deployKey: string; expiresAt: number }
>();
const userJwtCache = new Map<string, { jwt: string; expiresAt: number }>();

function getConvexSiteUrl(): string {
  const url = process.env.CONVEX_SITE_URL;
  if (!url) throw new Error("CONVEX_SITE_URL is required");
  return url;
}

function getBootstrapSecret(): string {
  const secret = process.env.MCP_BOOTSTRAP_SECRET;
  if (!secret) throw new Error("MCP_BOOTSTRAP_SECRET is required");
  return secret;
}

/** Eva's own Convex cloud URL (derived from the .convex.site HTTP URL). */
function getEvaConvexCloudUrl(): string {
  return getConvexSiteUrl().replace(".convex.site", ".convex.cloud");
}

/** Deployed web app origin, used to build hosted artifact view links. */
function getWebAppUrl(): string {
  const url = process.env.WEB_APP_URL;
  if (!url) throw new Error("WEB_APP_URL is required");
  return url.replace(/\/$/, "");
}

async function getDeployKey(): Promise<string> {
  if (cachedDeployKey && cachedDeployKey.expiresAt > Date.now()) {
    return cachedDeployKey.value;
  }
  const response = await fetch(`${getConvexSiteUrl()}/api/mcp/bootstrap`, {
    headers: { Authorization: `MCPBootstrap ${getBootstrapSecret()}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to bootstrap deploy key: HTTP ${response.status}`);
  }
  const body = z.object({ deployKey: z.string() }).parse(await response.json());
  cachedDeployKey = {
    value: body.deployKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return body.deployKey;
}

async function runTestQueryRemote(
  convexUrl: string,
  deployKey: string,
  source: string,
): Promise<{ value: JsonValue; logLines: string[] }> {
  const response = await fetch(`${convexUrl}/api/run_test_function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminKey: deployKey,
      args: {},
      bundle: { path: "testQuery.js", source },
      format: "convex_encoded_json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return { value: result.value, logLines: result.logLines ?? [] };
}

async function resolveUserByClerkId(
  deployKey: string,
  clerkUserId: string,
): Promise<string | null> {
  const cached = userIdCache.get(clerkUserId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.userId;
  }

  const convexUrl = getConvexSiteUrl().replace(".convex.site", ".convex.cloud");
  const source = wrapQueryHandler(
    `const user = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", ${JSON.stringify(clerkUserId)})).first();
    return user ? user._id : null;`,
  );
  const result = await runTestQueryRemote(convexUrl, deployKey, source);
  if (typeof result.value === "string") {
    userIdCache.set(clerkUserId, {
      userId: result.value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return result.value;
  }
  return null;
}

async function signUserJwt(clerkUserId: string): Promise<string> {
  const cached = userJwtCache.get(clerkUserId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.jwt;
  }

  const privateKeyJson = process.env.SANDBOX_JWT_PRIVATE_KEY;
  if (!privateKeyJson) throw new Error("Missing SANDBOX_JWT_PRIVATE_KEY");

  const issuer = getConvexSiteUrl();
  const privateKeyJwk: Record<string, string> = JSON.parse(privateKeyJson);
  const kid = privateKeyJwk.kid ?? "sandbox-1";
  const key = await importJWK(privateKeyJwk, "ES256");

  const jwt = await new SignJWT({ sub: clerkUserId })
    .setProtectedHeader({ alg: "ES256", kid })
    .setIssuer(issuer)
    .setAudience("convex")
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(key);

  userJwtCache.set(clerkUserId, {
    jwt,
    expiresAt: Date.now() + 55 * 60 * 1000,
  });

  return jwt;
}

async function runMutationAsUser(
  convexUrl: string,
  clerkUserId: string,
  functionPath: string,
  args: Record<string, JsonValue>,
): Promise<JsonValue> {
  const jwt = await signUserJwt(clerkUserId);
  const response = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return result.value;
}

/**
 * Call a Convex query as the given user (mirrors runMutationAsUser but hits
 * /api/query). Reuses the signed user JWT so the query's authQuery wrapper and
 * access checks (hasRepoAccess/hasTeamAccess) apply automatically.
 */
async function runQueryAsUser(
  convexUrl: string,
  clerkUserId: string,
  functionPath: string,
  args: Record<string, JsonValue>,
): Promise<JsonValue> {
  const jwt = await signUserJwt(clerkUserId);
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return result.value;
}

async function ensureUserExists(
  convexUrl: string,
  clerkUserId: string,
): Promise<string> {
  const result = await runMutationAsUser(
    convexUrl,
    clerkUserId,
    "auth:ensureUserExists",
    {},
  );
  const parsed = z
    .object({ userId: z.string(), wasCreated: z.boolean() })
    .parse(result);
  return parsed.userId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Actions for MCP Tools
// ─────────────────────────────────────────────────────────────────────────────

export const getContext = internalAction({
  args: { clerkUserId: v.string() },
  returns: v.object({ deployKey: v.string(), userId: v.string() }),
  handler: async (_ctx, { clerkUserId }) => {
    const deployKey = await getDeployKey();
    let userId = await resolveUserByClerkId(deployKey, clerkUserId);
    if (!userId) {
      const convexUrl = getConvexSiteUrl().replace(
        ".convex.site",
        ".convex.cloud",
      );
      userId = await ensureUserExists(convexUrl, clerkUserId);
    }
    return { deployKey, userId };
  },
});

const repoSchema = z.object({
  id: z.string(),
  owner: z.string(),
  name: z.string(),
  rootDirectory: z.string().nullable(),
  mcpRootPrompt: z.string().nullable(),
});

export const listUserRepos = internalAction({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      owner: v.string(),
      name: v.string(),
      rootDirectory: v.union(v.string(), v.null()),
      mcpRootPrompt: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (_ctx, { userId }) => {
    const deployKey = await getDeployKey();
    const convexUrl = getConvexSiteUrl().replace(
      ".convex.site",
      ".convex.cloud",
    );

    const source = wrapQueryHandler(
      `const userId = ${JSON.stringify(userId)};
      const toEntry = (r) => ({ id: r._id, owner: r.owner, name: r.name, rootDirectory: r.rootDirectory ?? null, mcpRootPrompt: r.mcpRootPrompt ?? null });
      const memberships = await ctx.db.query("teamMembers").withIndex("by_user", q => q.eq("userId", userId)).collect();
      const teamRepoResults = await Promise.all(memberships.map(m => ctx.db.query("githubRepos").withIndex("by_team", q => q.eq("teamId", m.teamId)).collect()));
      const connectedRepos = await ctx.db.query("githubRepos").withIndex("by_connected_by", q => q.eq("connectedBy", userId)).collect();
      const seen = new Set();
      const result = [];
      for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
        if (seen.has(String(repo._id))) continue;
        seen.add(String(repo._id));
        result.push(toEntry(repo));
      }
      return result;`,
    );
    const result = await runTestQueryRemote(convexUrl, deployKey, source);
    return z.array(repoSchema).parse(result.value);
  },
});

interface EnvVar {
  key: string;
  value: string;
}

/**
 * Lookup keys for Convex credentials, per environment.
 *
 * Staging keys are the canonical/legacy keys (also consumed by the sandbox and
 * the deployed app). Prod keys are MCP-only and should be stored with
 * `sandboxExclude: true` so they never reach the sandbox.
 */
const CONVEX_CRED_KEYS = {
  staging: {
    url: ["NEXT_PUBLIC_CONVEX_URL", "VITE_CONVEX_URL", "CONVEX_URL"],
    deployKey: ["CONVEX_DEPLOY_KEY", "CONVEX_ADMIN_KEY"],
  },
  prod: {
    url: ["PROD_CONVEX_URL"],
    deployKey: ["PROD_CONVEX_DEPLOY_KEY", "PROD_CONVEX_ADMIN_KEY"],
  },
} as const;

export const getRepoConvexCredentials = internalAction({
  args: {
    repoId: v.string(),
    userId: v.string(),
    environment: v.optional(v.union(v.literal("staging"), v.literal("prod"))),
  },
  returns: v.union(
    v.object({ convexUrl: v.string(), deployKey: v.string() }),
    v.null(),
  ),
  handler: async (
    ctx,
    { repoId, userId, environment },
  ): Promise<{ convexUrl: string; deployKey: string } | null> => {
    const env = environment ?? "prod";
    const cacheKey = `${userId}:${repoId}:${env}`;
    const cached = repoCredentialsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { convexUrl: cached.convexUrl, deployKey: cached.deployKey };
    }

    const vars: EnvVar[] = await ctx.runAction(
      internal.mcp.routes.getDecryptedRepoEnvVars,
      { repoId },
    );

    const lookup = CONVEX_CRED_KEYS[env];
    const urlEntry: EnvVar | undefined = lookup.url
      .map((k) => vars.find((entry) => entry.key === k))
      .find((entry): entry is EnvVar => entry !== undefined);
    const keyEntry: EnvVar | undefined = lookup.deployKey
      .map((k) => vars.find((entry) => entry.key === k))
      .find((entry): entry is EnvVar => entry !== undefined);

    if (!urlEntry || !keyEntry) return null;

    const creds: { convexUrl: string; deployKey: string; expiresAt: number } = {
      convexUrl: urlEntry.value.replace(/\/$/, ""),
      deployKey: keyEntry.value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    repoCredentialsCache.set(cacheKey, creds);
    return { convexUrl: creds.convexUrl, deployKey: creds.deployKey };
  },
});

const schemaTableSchema = z.object({
  tableName: z.string(),
  indexes: jsonValue,
  searchIndexes: jsonValue,
  vectorIndexes: jsonValue,
  documentType: jsonValue,
});

export const listTables = internalAction({
  args: { convexUrl: v.string(), deployKey: v.string() },
  returns: v.array(v.any()),
  handler: async (_ctx, { convexUrl, deployKey }) => {
    // Fetch shapes
    const shapesResponse = await fetch(`${convexUrl}/api/shapes2`, {
      headers: authHeaders(deployKey),
    });
    if (!shapesResponse.ok) {
      throw new Error(
        `HTTP ${shapesResponse.status}: ${await shapesResponse.text()}`,
      );
    }
    const shapes = z
      .record(z.string(), jsonValue)
      .parse(await shapesResponse.json());

    // Fetch declared schema
    const schemaResponse = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: authHeaders(deployKey),
      body: JSON.stringify({
        path: "_system/frontend/getSchemas",
        args: {},
        format: "json",
      }),
    });
    if (!schemaResponse.ok) {
      throw new Error(
        `HTTP ${schemaResponse.status}: ${await schemaResponse.text()}`,
      );
    }
    const schemaJson = await schemaResponse.json();
    const schemaResult = parseConvexResponse(jsonValue.parse(schemaJson));
    const schemaValue = z
      .object({ active: z.string().nullable() })
      .parse(schemaResult.value);

    let declaredTables: z.infer<typeof schemaTableSchema>[] = [];
    if (schemaValue.active) {
      const parsed = z
        .object({ tables: z.array(schemaTableSchema) })
        .parse(JSON.parse(schemaValue.active));
      declaredTables = parsed.tables;
    }

    const schemaByTable: Record<string, z.infer<typeof schemaTableSchema>> = {};
    for (const table of declaredTables) {
      schemaByTable[table.tableName] = table;
    }

    const allTableNames = new Set([
      ...Object.keys(shapes),
      ...Object.keys(schemaByTable),
    ]);
    const sortedNames = Array.from(allTableNames).sort();

    return sortedNames.map((name) => ({
      name,
      declaredSchema: schemaByTable[name] ?? null,
      inferredShape: shapes[name] ?? null,
    }));
  },
});

const paginationResultSchema = z.object({
  page: z.array(jsonValue),
  isDone: z.boolean(),
  continueCursor: z.string(),
});

export const queryTable = internalAction({
  args: {
    convexUrl: v.string(),
    deployKey: v.string(),
    table: v.string(),
    order: v.union(v.literal("asc"), v.literal("desc")),
    numItems: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (
    _ctx,
    { convexUrl, deployKey, table, order, numItems, cursor },
  ) => {
    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: authHeaders(deployKey),
      body: JSON.stringify({
        path: "_system/cli/tableData",
        args: { table, order, paginationOpts: { numItems, cursor } },
        format: "json",
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const json = await response.json();
    const result = parseConvexResponse(jsonValue.parse(json));
    return paginationResultSchema.parse(result.value);
  },
});

export const runTestQuery = internalAction({
  args: { convexUrl: v.string(), deployKey: v.string(), code: v.string() },
  returns: v.object({ value: v.any(), logLines: v.array(v.string()) }),
  handler: async (_ctx, { convexUrl, deployKey, code }) => {
    const source = wrapQueryHandler(code);
    return runTestQueryRemote(convexUrl, deployKey, source);
  },
});

export const createTask = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    title: v.string(),
    description: v.string(),
    model: v.optional(
      v.union(v.literal("opus"), v.literal("sonnet"), v.literal("haiku")),
    ),
    baseBranch: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (
    _ctx,
    { clerkUserId, repoId, title, description, model, baseBranch, projectId },
  ) => {
    const convexUrl = getConvexSiteUrl().replace(
      ".convex.site",
      ".convex.cloud",
    );
    const mutationArgs: Record<string, JsonValue> = {
      repoId,
      title,
      description,
    };
    if (model) mutationArgs.model = model;
    if (baseBranch) mutationArgs.baseBranch = baseBranch;
    if (projectId) mutationArgs.projectId = projectId;

    const taskId = await runMutationAsUser(
      convexUrl,
      clerkUserId,
      "_agentTasks/mutations:createQuickTask",
      mutationArgs,
    );

    if (typeof taskId !== "string") {
      throw new Error("Unexpected response from createQuickTask");
    }
    return taskId;
  },
});

export const startTaskExecution = internalAction({
  args: { clerkUserId: v.string(), taskId: v.string() },
  returns: v.null(),
  handler: async (_ctx, { clerkUserId, taskId }) => {
    const convexUrl = getConvexSiteUrl().replace(
      ".convex.site",
      ".convex.cloud",
    );
    await runMutationAsUser(
      convexUrl,
      clerkUserId,
      "_agentTasks/execution:startExecution",
      { id: taskId },
    );
    return null;
  },
});

export const createTasksBatch = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        dependsOn: v.optional(v.array(v.number())),
      }),
    ),
    projectTitle: v.optional(v.string()),
    model: v.optional(
      v.union(v.literal("opus"), v.literal("sonnet"), v.literal("haiku")),
    ),
    baseBranch: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (
    _ctx,
    { clerkUserId, repoId, tasks, projectTitle, model, baseBranch },
  ) => {
    const convexUrl = getConvexSiteUrl().replace(
      ".convex.site",
      ".convex.cloud",
    );
    const mutationArgs: Record<string, JsonValue> = {
      repoId,
      tasks: tasks.map((t) => ({
        title: t.title,
        ...(t.description ? { description: t.description } : {}),
        ...(t.dependsOn ? { dependsOn: t.dependsOn } : {}),
      })),
    };
    if (projectTitle) mutationArgs.projectTitle = projectTitle;
    if (model) mutationArgs.model = model;
    if (baseBranch) mutationArgs.baseBranch = baseBranch;

    const result = await runMutationAsUser(
      convexUrl,
      clerkUserId,
      "_agentTasks/mutations:createBatchWithDependencies",
      mutationArgs,
    );
    return result;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Eva document (docs table) actions
//
// These operate on Eva's OWN docs (design docs/PRDs), not a connected repo's
// database. Reads use runQueryAsUser and writes use runMutationAsUser, so the
// docs.ts authQuery/authMutation access checks (hasRepoAccess) apply.
// ─────────────────────────────────────────────────────────────────────────────

export const createEvaDoc = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  returns: v.string(),
  handler: async (_ctx, { clerkUserId, repoId, title, content }) => {
    const docId = await runMutationAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      "docs:create",
      { repoId, title, content },
    );
    if (typeof docId !== "string") {
      throw new Error("Unexpected response from docs:create");
    }
    return docId;
  },
});

export const getEvaDoc = internalAction({
  args: { clerkUserId: v.string(), docId: v.string() },
  returns: v.any(),
  handler: async (_ctx, { clerkUserId, docId }) => {
    return runQueryAsUser(getEvaConvexCloudUrl(), clerkUserId, "docs:get", {
      id: docId,
    });
  },
});

export const listEvaDocs = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    kind: v.optional(v.union(v.literal("document"), v.literal("pr-recap"))),
  },
  returns: v.any(),
  handler: async (_ctx, { clerkUserId, repoId, kind }) => {
    const args: Record<string, string> = { repoId };
    if (kind !== undefined) args.kind = kind;
    return runQueryAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      "docs:list",
      args,
    );
  },
});

export const updateEvaDoc = internalAction({
  args: {
    clerkUserId: v.string(),
    docId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (
    _ctx,
    { clerkUserId, docId, title, content, description },
  ) => {
    const mutationArgs: Record<string, JsonValue> = { id: docId };
    if (title !== undefined) mutationArgs.title = title;
    if (content !== undefined) mutationArgs.content = content;
    if (description !== undefined) mutationArgs.description = description;
    await runMutationAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      "docs:update",
      mutationArgs,
    );
    return null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Team + artifact actions
// ─────────────────────────────────────────────────────────────────────────────

const teamSchema = z.object({ id: z.string(), name: z.string() });

export const listUserTeams = internalAction({
  args: { userId: v.string() },
  returns: v.array(v.object({ id: v.string(), name: v.string() })),
  handler: async (_ctx, { userId }) => {
    const deployKey = await getDeployKey();
    const source = wrapQueryHandler(
      `const userId = ${JSON.stringify(userId)};
      const memberships = await ctx.db.query("teamMembers").withIndex("by_user", q => q.eq("userId", userId)).collect();
      const teams = await Promise.all(memberships.map(m => ctx.db.get(m.teamId)));
      return teams.filter(Boolean).map(t => ({ id: t._id, name: t.name }));`,
    );
    const result = await runTestQueryRemote(
      getEvaConvexCloudUrl(),
      deployKey,
      source,
    );
    return z.array(teamSchema).parse(result.value);
  },
});

export const createArtifact = internalAction({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    html: v.string(),
    description: v.optional(v.string()),
    boundTeamId: v.string(),
    declaredTools: v.array(v.string()),
  },
  returns: v.object({ artifactId: v.string(), viewUrl: v.string() }),
  handler: async (
    _ctx,
    { clerkUserId, name, html, description, boundTeamId, declaredTools },
  ) => {
    const convexUrl = getEvaConvexCloudUrl();

    // 1. Get a short-lived storage upload URL (as the user).
    const uploadUrl = await runMutationAsUser(
      convexUrl,
      clerkUserId,
      "artifacts:generateUploadUrl",
      {},
    );
    if (typeof uploadUrl !== "string") {
      throw new Error("Unexpected response from artifacts:generateUploadUrl");
    }

    // 2. Upload the HTML bytes to Convex storage.
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: html,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Storage upload failed: HTTP ${uploadResponse.status}`);
    }
    const { storageId } = z
      .object({ storageId: z.string() })
      .parse(await uploadResponse.json());

    // 3. Create the artifact record (as the user; enforces team membership).
    const createArgs: Record<string, JsonValue> = {
      name,
      boundTeamId,
      declaredTools,
      htmlStorageId: storageId,
    };
    if (description) createArgs.description = description;
    const artifactId = await runMutationAsUser(
      convexUrl,
      clerkUserId,
      "artifacts:create",
      createArgs,
    );
    if (typeof artifactId !== "string") {
      throw new Error("Unexpected response from artifacts:create");
    }

    return {
      artifactId,
      viewUrl: `${getWebAppUrl()}/artifacts/${artifactId}`,
    };
  },
});

export const getArtifact = internalAction({
  args: { clerkUserId: v.string(), artifactId: v.string() },
  returns: v.any(),
  handler: async (_ctx, { clerkUserId, artifactId }) => {
    const artifact = await runQueryAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      "artifacts:get",
      { id: artifactId },
    );
    if (artifact === null) return null;
    return {
      artifact,
      viewUrl: `${getWebAppUrl()}/artifacts/${artifactId}`,
    };
  },
});

export const listArtifacts = internalAction({
  args: { clerkUserId: v.string() },
  returns: v.any(),
  handler: async (_ctx, { clerkUserId }) => {
    const artifacts = await runQueryAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      "artifacts:listAll",
      {},
    );
    if (!Array.isArray(artifacts)) return [];
    const webAppUrl = getWebAppUrl();
    return artifacts.map((artifact) => {
      const id =
        artifact !== null &&
        typeof artifact === "object" &&
        !Array.isArray(artifact)
          ? artifact._id
          : null;
      return {
        artifact,
        viewUrl: typeof id === "string" ? `${webAppUrl}/artifacts/${id}` : null,
      };
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator actions (master session fleet control)
//
// Every call below goes through runQueryAsUser / runMutationAsUser, i.e. a
// signed user JWT hitting authQuery/authMutation. Their hasRepoAccess checks
// are the ONLY authorisation for orchestrator tools — unlike the repo-scoped
// tools these deliberately skip the sandbox token's single-repo pin, so the
// master can reach every agent the user can reach and nothing more.
// ─────────────────────────────────────────────────────────────────────────────

const agentKindValidator = v.union(v.literal("session"), v.literal("task"));
type AgentKind = "session" | "task";

const orchestratorAgentValidator = v.object({
  kind: agentKindValidator,
  id: v.string(),
  numId: v.optional(v.number()),
  repo: v.string(),
  title: v.string(),
  status: v.string(),
  isExecuting: v.boolean(),
  model: v.optional(v.string()),
  updatedAt: v.number(),
});

interface OrchestratorAgent {
  kind: AgentKind;
  id: string;
  numId?: number;
  repo: string;
  title: string;
  status: string;
  isExecuting: boolean;
  model?: string;
  updatedAt: number;
}

/** Slim projection of `_sessions/queries:list` rows. */
const sessionListItemSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  numId: z.number().optional(),
  repoId: z.string(),
  title: z.string(),
  status: z.string(),
  updatedAt: z.number().optional(),
  lastModel: z.string().optional(),
  isExecuting: z.boolean(),
});

/** Slim projection of an `agentTasks` document. */
const agentTaskSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  numId: z.number().optional(),
  repoId: z.string().optional(),
  title: z.string(),
  status: z.string(),
  updatedAt: z.number(),
  model: z.string().optional(),
  lastChatModel: z.string().optional(),
  activeWorkflowId: z.string().optional(),
  activeChatWorkflowId: z.string().optional(),
});

/** Slim projection of a `sessions` document. */
const sessionDocSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  numId: z.number().optional(),
  repoId: z.string(),
  title: z.string(),
  status: z.string(),
  updatedAt: z.number().optional(),
  lastModel: z.string().optional(),
  lastMode: z.string().optional(),
  activeWorkflowId: z.string().optional(),
  deploymentUrl: z.string().optional(),
  deploymentStatus: z.string().optional(),
});

const streamingStateSchema = z
  .object({
    currentActivity: z.string(),
    currentContent: z.string(),
    pendingQuestion: z.string().optional(),
  })
  .nullable();

const transcriptMessageSchema = z.object({
  _creationTime: z.number(),
  role: z.string(),
  content: z.string(),
  timestamp: z.number().optional(),
});

const createdSessionSchema = z.object({
  sessionId: z.string(),
  numId: z.number(),
});

/** Longest message body kept per transcript entry in `get_agent_state`. */
const TRANSCRIPT_CHAR_LIMIT = 2000;

/**
 * Points a child session/task at the master session so a later completion can
 * wake it. Called implicitly by create/send and explicitly by watch_agent.
 */
async function setWatchedByOrchestrator(
  clerkUserId: string,
  kind: AgentKind,
  id: string,
  masterSessionId: string | undefined,
): Promise<void> {
  const args: Record<string, JsonValue> =
    kind === "session" ? { sessionId: id } : { taskId: id };
  if (masterSessionId !== undefined) args.masterSessionId = masterSessionId;
  await runMutationAsUser(
    getEvaConvexCloudUrl(),
    clerkUserId,
    kind === "session"
      ? "orchestratorWatch:setSessionWatchedBy"
      : "orchestratorWatch:setTaskWatchedBy",
    args,
  );
}

export const orchestratorListAgents = internalAction({
  args: {
    clerkUserId: v.string(),
    repos: v.array(v.object({ id: v.string(), fullName: v.string() })),
    includeIdle: v.boolean(),
    excludeEntityId: v.optional(v.string()),
  },
  returns: v.array(orchestratorAgentValidator),
  handler: async (
    _ctx,
    { clerkUserId, repos, includeIdle, excludeEntityId },
  ): Promise<OrchestratorAgent[]> => {
    const convexUrl = getEvaConvexCloudUrl();
    const repoNameById = new Map(repos.map((r) => [r.id, r.fullName]));

    const [sessionGroups, rawTasks] = await Promise.all([
      Promise.all(
        repos.map((repo) =>
          runQueryAsUser(convexUrl, clerkUserId, "_sessions/queries:list", {
            repoId: repo.id,
          }),
        ),
      ),
      // Already user-wide, so one call covers every repo.
      runQueryAsUser(
        convexUrl,
        clerkUserId,
        "_agentTasks/queries:getActiveTasks",
        {},
      ),
    ]);

    const agents: OrchestratorAgent[] = [];
    for (const group of sessionGroups) {
      for (const item of z.array(sessionListItemSchema).parse(group)) {
        agents.push({
          kind: "session",
          id: item._id,
          numId: item.numId,
          repo: repoNameById.get(item.repoId) ?? item.repoId,
          title: item.title,
          status: item.status,
          isExecuting: item.isExecuting,
          model: item.lastModel,
          updatedAt: item.updatedAt ?? item._creationTime,
        });
      }
    }
    for (const task of z.array(agentTaskSchema).parse(rawTasks)) {
      // Keep tasks inside the requested repo scope (all repos, or one).
      if (task.repoId === undefined) continue;
      const repoName = repoNameById.get(task.repoId);
      if (repoName === undefined) continue;
      agents.push({
        kind: "task",
        id: task._id,
        numId: task.numId,
        repo: repoName,
        title: task.title,
        status: task.status,
        isExecuting:
          task.activeWorkflowId !== undefined ||
          task.activeChatWorkflowId !== undefined,
        model: task.lastChatModel ?? task.model,
        updatedAt: task.updatedAt,
      });
    }

    return agents
      .filter((agent) => agent.id !== excludeEntityId)
      .filter((agent) => includeIdle || agent.isExecuting)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const orchestratorGetAgentState = internalAction({
  args: {
    clerkUserId: v.string(),
    kind: agentKindValidator,
    id: v.string(),
    transcriptTail: v.number(),
  },
  returns: v.object({
    kind: agentKindValidator,
    id: v.string(),
    numId: v.optional(v.number()),
    title: v.string(),
    status: v.string(),
    isExecuting: v.boolean(),
    model: v.optional(v.string()),
    updatedAt: v.number(),
    deploymentUrl: v.optional(v.string()),
    deploymentStatus: v.optional(v.string()),
    currentActivity: v.optional(v.string()),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
    queuedMessageCount: v.number(),
    transcript: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
        truncated: v.boolean(),
      }),
    ),
  }),
  handler: async (_ctx, { clerkUserId, kind, id, transcriptTail }) => {
    const convexUrl = getEvaConvexCloudUrl();
    const streamingEntityId =
      kind === "session" ? id : `${TASK_CHAT_STREAM_PREFIX}${id}`;

    const [rawDoc, rawStreaming, rawMessages, rawQueued] = await Promise.all([
      runQueryAsUser(
        convexUrl,
        clerkUserId,
        kind === "session"
          ? "_sessions/queries:get"
          : "_agentTasks/queries:get",
        { id },
      ),
      runQueryAsUser(convexUrl, clerkUserId, "streaming:get", {
        entityId: streamingEntityId,
      }),
      runQueryAsUser(convexUrl, clerkUserId, "messages:listByParent", {
        parentId: id,
      }),
      runQueryAsUser(convexUrl, clerkUserId, "queuedMessages:listByParent", {
        parentId: id,
      }),
    ]);

    if (rawDoc === null) {
      throw new Error(`No ${kind} ${id} found, or you do not have access.`);
    }

    const streaming = streamingStateSchema.parse(rawStreaming);
    const queuedMessageCount = z.array(z.unknown()).parse(rawQueued).length;
    const messages = z.array(transcriptMessageSchema).parse(rawMessages);
    const tail = transcriptTail > 0 ? messages.slice(-transcriptTail) : [];
    const transcript = tail.map((message) => ({
      role: message.role,
      content: message.content.slice(0, TRANSCRIPT_CHAR_LIMIT),
      timestamp: message.timestamp ?? message._creationTime,
      truncated: message.content.length > TRANSCRIPT_CHAR_LIMIT,
    }));

    const common = {
      kind,
      id,
      queuedMessageCount,
      transcript,
      currentActivity: streaming?.currentActivity,
      currentContent: streaming?.currentContent,
      pendingQuestion: streaming?.pendingQuestion,
    };

    if (kind === "session") {
      const session = sessionDocSchema.parse(rawDoc);
      return {
        ...common,
        numId: session.numId,
        title: session.title,
        status: session.status,
        isExecuting: session.activeWorkflowId !== undefined,
        model: session.lastModel,
        updatedAt: session.updatedAt ?? session._creationTime,
        deploymentUrl: session.deploymentUrl,
        deploymentStatus: session.deploymentStatus,
      };
    }

    const task = agentTaskSchema.parse(rawDoc);
    return {
      ...common,
      numId: task.numId,
      title: task.title,
      status: task.status,
      isExecuting:
        task.activeWorkflowId !== undefined ||
        task.activeChatWorkflowId !== undefined,
      model: task.lastChatModel ?? task.model,
      updatedAt: task.updatedAt,
      deploymentUrl: undefined,
      deploymentStatus: undefined,
    };
  },
});

export const orchestratorSendMessage = internalAction({
  args: {
    clerkUserId: v.string(),
    kind: agentKindValidator,
    id: v.string(),
    message: v.string(),
    model: v.optional(v.string()),
    masterSessionId: v.optional(v.string()),
  },
  returns: v.object({
    delivered: v.union(v.literal("started"), v.literal("queued")),
    model: v.string(),
  }),
  handler: async (
    _ctx,
    { clerkUserId, kind, id, message, model, masterSessionId },
  ) => {
    const convexUrl = getEvaConvexCloudUrl();
    const rawDoc = await runQueryAsUser(
      convexUrl,
      clerkUserId,
      kind === "session" ? "_sessions/queries:get" : "_agentTasks/queries:get",
      { id },
    );
    if (rawDoc === null) {
      throw new Error(`No ${kind} ${id} found, or you do not have access.`);
    }

    if (kind === "session") {
      const session = sessionDocSchema.parse(rawDoc);
      const delivery = resolveAgentDelivery({
        isBusy: session.activeWorkflowId !== undefined,
        requestedModel: model,
        storedModel: session.lastModel,
      });
      const mode = session.lastMode ?? "edit";
      if (delivery.action === "queue") {
        // The queue drain inserts the user message row on dequeue.
        await runMutationAsUser(
          convexUrl,
          clerkUserId,
          "_sessions/execution:enqueueMessage",
          { sessionId: id, message, mode, model: delivery.model },
        );
      } else {
        // startExecute only stages the assistant placeholder, so the user row
        // has to be inserted first (same pairing the web composer uses).
        await runMutationAsUser(
          convexUrl,
          clerkUserId,
          "_sessions/mutations:addMessage",
          {
            id,
            role: "user",
            content: message,
            mode,
            model: delivery.model,
            sentViaOrchestrator: true,
          },
        );
        await runMutationAsUser(
          convexUrl,
          clerkUserId,
          "_sessions/execution:startExecute",
          { sessionId: id, message, mode, model: delivery.model },
        );
      }
      await setWatchedByOrchestrator(clerkUserId, kind, id, masterSessionId);
      const delivered: "queued" | "started" =
        delivery.action === "queue" ? "queued" : "started";
      return { delivered, model: delivery.model };
    }

    const task = agentTaskSchema.parse(rawDoc);
    const delivery = resolveAgentDelivery({
      // The chat surface has its own workflow slot, separate from a task run.
      isBusy: task.activeChatWorkflowId !== undefined,
      requestedModel: model,
      storedModel: task.lastChatModel ?? task.model,
    });
    if (delivery.action === "queue") {
      await runMutationAsUser(
        convexUrl,
        clerkUserId,
        "agentTaskChatWorkflow:enqueueMessage",
        { taskId: id, message, model: delivery.model },
      );
    } else {
      await runMutationAsUser(
        convexUrl,
        clerkUserId,
        "agentTaskChatWorkflow:addMessage",
        {
          taskId: id,
          role: "user",
          content: message,
          model: delivery.model,
          sentViaOrchestrator: true,
        },
      );
      await runMutationAsUser(
        convexUrl,
        clerkUserId,
        "agentTaskChatWorkflow:startExecute",
        { taskId: id, message, model: delivery.model },
      );
    }
    await setWatchedByOrchestrator(clerkUserId, kind, id, masterSessionId);
    const delivered: "queued" | "started" =
      delivery.action === "queue" ? "queued" : "started";
    return { delivered, model: delivery.model };
  },
});

export const orchestratorStopAgent = internalAction({
  args: {
    clerkUserId: v.string(),
    kind: agentKindValidator,
    id: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, { clerkUserId, kind, id }) => {
    await runMutationAsUser(
      getEvaConvexCloudUrl(),
      clerkUserId,
      kind === "session"
        ? "_sessions/execution:cancelExecution"
        : "agentTaskChatWorkflow:cancelExecution",
      kind === "session" ? { sessionId: id } : { taskId: id },
    );
    return null;
  },
});

export const orchestratorCreateSession = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    model: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    masterSessionId: v.optional(v.string()),
  },
  returns: v.object({ sessionId: v.string(), numId: v.number() }),
  handler: async (
    _ctx,
    { clerkUserId, repoId, title, message, model, baseBranch, masterSessionId },
  ) => {
    const createArgs: Record<string, JsonValue> = {
      repoId,
      message,
      mode: "edit",
      model: normalizeAIModel(model),
    };
    if (title) createArgs.title = title;
    if (baseBranch) createArgs.baseBranch = baseBranch;

    const created = createdSessionSchema.parse(
      await runMutationAsUser(
        getEvaConvexCloudUrl(),
        clerkUserId,
        "_sessions/mutations:create",
        createArgs,
      ),
    );
    await setWatchedByOrchestrator(
      clerkUserId,
      "session",
      created.sessionId,
      masterSessionId,
    );
    return created;
  },
});

export const orchestratorSetWatch = internalAction({
  args: {
    clerkUserId: v.string(),
    kind: agentKindValidator,
    id: v.string(),
    masterSessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, { clerkUserId, kind, id, masterSessionId }) => {
    await setWatchedByOrchestrator(clerkUserId, kind, id, masterSessionId);
    return null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Proxy Helpers
// ─────────────────────────────────────────────────────────────────────────────

const supabaseTokenCache = new Map<
  string,
  { token: string; expiresAt: number }
>();

export const resolveSupabaseToken = internalAction({
  args: { clerkUserId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { clerkUserId }): Promise<string | null> => {
    const cached = supabaseTokenCache.get(clerkUserId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const deployKey = await getDeployKey();
    const userId = await resolveUserByClerkId(deployKey, clerkUserId);
    if (!userId) return null;

    // Get repos and search for SUPABASE_ACCESS_TOKEN
    const convexUrl = getConvexSiteUrl().replace(
      ".convex.site",
      ".convex.cloud",
    );
    const source = wrapQueryHandler(
      `const userId = ${JSON.stringify(userId)};
      const memberships = await ctx.db.query("teamMembers").withIndex("by_user", q => q.eq("userId", userId)).collect();
      const teamRepoResults = await Promise.all(memberships.map(m => ctx.db.query("githubRepos").withIndex("by_team", q => q.eq("teamId", m.teamId)).collect()));
      const connectedRepos = await ctx.db.query("githubRepos").withIndex("by_connected_by", q => q.eq("connectedBy", userId)).collect();
      const seen = new Set();
      const result = [];
      for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
        if (seen.has(String(repo._id))) continue;
        seen.add(String(repo._id));
        result.push(repo._id);
      }
      return result;`,
    );
    const result = await runTestQueryRemote(convexUrl, deployKey, source);
    const repoIds = z.array(z.string()).parse(result.value);

    // Search for Supabase token in each repo's env vars
    for (const repoId of repoIds) {
      try {
        const vars: EnvVar[] = await ctx.runAction(
          internal.mcp.routes.getDecryptedRepoEnvVars,
          { repoId },
        );
        const match: EnvVar | undefined = vars.find(
          (entry) => entry.key === "SUPABASE_ACCESS_TOKEN",
        );
        if (match) {
          supabaseTokenCache.set(clerkUserId, {
            token: match.value,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
          return match.value;
        }
      } catch {
        // Skip failed repos
      }
    }

    return null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP Request Handler
// ─────────────────────────────────────────────────────────────────────────────

export const handleMcpRequest = internalAction({
  args: {
    clerkUserId: v.string(),
    scopedRepoId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityKind: v.optional(
      v.union(v.literal("session"), v.literal("task"), v.literal("project")),
    ),
    isOrchestrator: v.optional(v.boolean()),
    body: v.string(),
  },
  returns: v.object({
    status: v.number(),
    body: v.string(),
  }),
  handler: async (
    ctx,
    { clerkUserId, scopedRepoId, entityId, entityKind, isOrchestrator, body },
  ) => {
    try {
      const parsedBody = JSON.parse(body);

      // Create MCP server with tools registered
      const server = new McpServer({
        name: "eva-mcp",
        version: "1.0.0",
      });

      // Register tools with credentials (including optional scoped repo /
      // session entity for browser tools).
      const credentials = {
        clerkUserId,
        scopedRepoId,
        entityId,
        entityKind,
        isOrchestrator,
      };
      registerTools(server, credentials, ctx);
      try {
        await registerSupabaseTools(server, credentials, ctx);
      } catch (err) {
        console.error(
          "[MCP][handleMcpRequest] supabase tools registration failed (continuing):",
          err instanceof Error ? err.message : err,
        );
      }

      // Create transport in stateless mode with JSON responses (no SSE).
      // WebStandardStreamableHTTPServerTransport works with Web Standard
      // Request/Response, avoiding Node.js req/res shimming entirely.
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      // Connect server to transport
      await server.connect(transport);

      // Build a Web Standard Request for the transport.
      // The transport validates Accept + Content-Type headers.
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body,
      });

      const response = await transport.handleRequest(req, { parsedBody });
      const responseBody = await response.text();

      return {
        status: response.status,
        body: responseBody,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      console.error("[MCP][handleMcpRequest] threw:", message, err);
      return {
        status: 500,
        body: JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message },
          id: null,
        }),
      };
    }
  },
});
