"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import {
  createClerkClient,
  verifyToken as clerkVerifyToken,
} from "@clerk/backend";
import { jwtVerify, SignJWT, importJWK } from "jose";
import { z } from "zod";
import { internal } from "../_generated/api";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools } from "./tools";
import { registerSupabaseTools } from "./supabase";

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
// Internal Actions
// ─────────────────────────────────────────────────────────────────────────────

export const getClerkPublishableKey = internalAction({
  args: {},
  returns: v.string(),
  handler: async () => {
    const key = process.env.CLERK_PUBLISHABLE_KEY;
    if (!key) throw new Error("CLERK_PUBLISHABLE_KEY is required");
    return key;
  },
});

export const verifyClerkTokenAction = internalAction({
  args: { token: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, { token }) => {
    try {
      const payload = await clerkVerifyToken(token, {
        secretKey: getClerkSecretKey(),
      });
      if (typeof payload === "object" && payload !== null && "sub" in payload) {
        const sub = payload.sub;
        if (typeof sub === "string") {
          return sub;
        }
      }
      return null;
    } catch {
      return null;
    }
  },
});

export const issueTokens = internalAction({
  args: { clerkUserId: v.string() },
  returns: v.object({
    access_token: v.string(),
    token_type: v.literal("Bearer"),
    expires_in: v.number(),
    scope: v.string(),
    refresh_token: v.string(),
  }),
  handler: async (_ctx, { clerkUserId }) => {
    const secret = new TextEncoder().encode(getJwtSecret());

    const accessToken = await new SignJWT({ sub: clerkUserId })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(secret);

    const refreshToken = await new SignJWT({
      sub: clerkUserId,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .setIssuedAt()
      .sign(secret);

    return {
      access_token: accessToken,
      token_type: "Bearer" as const,
      expires_in: 3600,
      scope: "claudeai",
      refresh_token: refreshToken,
    };
  },
});

export const refreshToken = internalAction({
  args: { refreshToken: v.string() },
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
  handler: async (ctx, { refreshToken }) => {
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jwtVerify(refreshToken, secret);

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("sub" in payload) ||
        typeof payload.sub !== "string" ||
        !("type" in payload) ||
        payload.type !== "refresh"
      ) {
        return { success: false as const, error: "Invalid refresh token" };
      }

      // Issue tokens directly (secret already defined above)
      const accessToken = await new SignJWT({ sub: payload.sub })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .setIssuedAt()
        .sign(secret);

      const newRefreshToken = await new SignJWT({
        sub: payload.sub,
        type: "refresh",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .setIssuedAt()
        .sign(secret);

      const tokens = {
        access_token: accessToken,
        token_type: "Bearer" as const,
        expires_in: 3600,
        scope: "claudeai",
        refresh_token: newRefreshToken,
      };

      return { success: true as const, tokens };
    } catch {
      return {
        success: false as const,
        error: "Expired or invalid refresh token",
      };
    }
  },
});

export const verifyAccessToken = internalAction({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      clerkUserId: v.string(),
      scopedRepoId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (_ctx, { token }) => {
    console.log("[MCP][verifyAccessToken] start, token len:", token.length);
    // Try OAuth token first
    try {
      const secret = new TextEncoder().encode(getJwtSecret());
      const { payload } = await jwtVerify(token, secret);

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("sub" in payload) ||
        typeof payload.sub !== "string"
      ) {
        console.log("[MCP][verifyAccessToken] oauth payload missing sub");
        // Not a valid OAuth token, try internal token
      } else {
        console.log(
          "[MCP][verifyAccessToken] oauth JWT verified, checking Clerk user:",
          payload.sub,
        );
        // Optionally verify user still exists in Clerk
        try {
          const clerk = createClerkClient({ secretKey: getClerkSecretKey() });
          await clerk.users.getUser(payload.sub);
          console.log("[MCP][verifyAccessToken] Clerk user OK");
          return { clerkUserId: payload.sub };
        } catch (err) {
          console.error(
            "[MCP][verifyAccessToken] Clerk getUser failed:",
            err instanceof Error ? err.message : err,
          );
          return null;
        }
      }
    } catch (err) {
      console.log(
        "[MCP][verifyAccessToken] not an oauth token:",
        err instanceof Error ? err.message : err,
      );
      // Not an OAuth token, try internal token
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
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("sub" in payload) ||
        typeof payload.sub !== "string" ||
        !("iss" in payload) ||
        payload.iss !== "eva" ||
        !("aud" in payload) ||
        payload.aud !== "mcp-internal" ||
        !("repoId" in payload) ||
        typeof payload.repoId !== "string"
      ) {
        console.error(
          "[MCP][verifyAccessToken] internal token payload invalid",
        );
        return null;
      }

      console.log(
        "[MCP][verifyAccessToken] internal token OK. sub:",
        payload.sub,
        "repoId:",
        payload.repoId,
      );
      return {
        clerkUserId: payload.sub,
        scopedRepoId: payload.repoId,
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

export const mintInternalToken = internalAction({
  args: {
    clerkUserId: v.string(),
    repoId: v.string(),
    bootstrapSecret: v.string(),
  },
  returns: v.union(
    v.object({
      token: v.string(),
      expiresIn: v.number(),
    }),
    v.null(),
  ),
  handler: async (_ctx, { clerkUserId, repoId, bootstrapSecret }) => {
    // Verify bootstrap secret
    const expectedSecret = process.env.MCP_BOOTSTRAP_SECRET;
    if (!expectedSecret || bootstrapSecret !== expectedSecret) return null;

    const internalSecret = process.env.MCP_INTERNAL_SECRET;
    if (!internalSecret) return null;

    const secret = new TextEncoder().encode(internalSecret);
    const expiresIn = 28800; // 8 hours

    const token = await new SignJWT({
      sub: clerkUserId,
      iss: "eva",
      aud: "mcp-internal",
      repoId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${expiresIn}s`)
      .setIssuedAt()
      .sign(secret);

    return { token, expiresIn };
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

export const getRepoConvexCredentials = internalAction({
  args: { repoId: v.string(), userId: v.string() },
  returns: v.union(
    v.object({ convexUrl: v.string(), deployKey: v.string() }),
    v.null(),
  ),
  handler: async (
    ctx,
    { repoId, userId },
  ): Promise<{ convexUrl: string; deployKey: string } | null> => {
    const cacheKey = `${userId}:${repoId}`;
    const cached = repoCredentialsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { convexUrl: cached.convexUrl, deployKey: cached.deployKey };
    }

    const vars: EnvVar[] = await ctx.runAction(
      internal.mcp.routes.getDecryptedRepoEnvVars,
      { repoId },
    );

    const urlEntry: EnvVar | undefined = vars.find(
      (entry) =>
        entry.key === "NEXT_PUBLIC_CONVEX_URL" || entry.key === "CONVEX_URL",
    );
    const keyEntry: EnvVar | undefined = vars.find(
      (entry) =>
        entry.key === "CONVEX_DEPLOY_KEY" || entry.key === "CONVEX_ADMIN_KEY",
    );

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
  },
  returns: v.string(),
  handler: async (
    _ctx,
    { clerkUserId, repoId, title, description, model, baseBranch },
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
    body: v.string(),
  },
  returns: v.object({
    status: v.number(),
    body: v.string(),
  }),
  handler: async (ctx, { clerkUserId, scopedRepoId, body }) => {
    try {
      console.log(
        "[MCP][handleMcpRequest] start. clerkUserId:",
        clerkUserId,
        "scopedRepoId:",
        scopedRepoId,
        "body preview:",
        body.slice(0, 200),
      );
      const parsedBody = JSON.parse(body);
      console.log(
        "[MCP][handleMcpRequest] JSON-RPC method:",
        parsedBody?.method,
      );

      // Create MCP server with tools registered
      const server = new McpServer({
        name: "eva-mcp",
        version: "1.0.0",
      });

      // Register tools with credentials (including optional scoped repo)
      const credentials = { clerkUserId, scopedRepoId };
      registerTools(server, credentials, ctx);
      console.log("[MCP][handleMcpRequest] base tools registered");
      try {
        await registerSupabaseTools(server, credentials, ctx);
        console.log("[MCP][handleMcpRequest] supabase tools registered");
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

      console.log(
        "[MCP][handleMcpRequest] done. status:",
        response.status,
        "body preview:",
        responseBody.slice(0, 300),
      );

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
