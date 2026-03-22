import { z } from "zod";
import { importJWK, SignJWT } from "jose";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedDeployKey: { value: string; expiresAt: number } | null = null;

function getBootstrapSecret(): string {
  const secret = process.env.MCP_BOOTSTRAP_SECRET;
  if (!secret) {
    throw new Error("MCP_BOOTSTRAP_SECRET environment variable is required");
  }
  return secret;
}

// Convex HTTP actions (http.ts routes) are served at .convex.site, not .convex.cloud.
// Database/REST API calls go to .convex.cloud. Derive the site URL for HTTP action calls.
function toSiteUrl(convexUrl: string): string {
  return convexUrl.replace(/\.convex\.cloud$/, ".convex.site");
}

export async function getDeployKey(convexUrl: string): Promise<string> {
  if (cachedDeployKey && cachedDeployKey.expiresAt > Date.now()) {
    return cachedDeployKey.value;
  }
  const response = await fetch(`${toSiteUrl(convexUrl)}/api/mcp/bootstrap`, {
    headers: { Authorization: `MCPBootstrap ${getBootstrapSecret()}` },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to bootstrap deploy key: HTTP ${response.status}. ` +
        "Ensure EVA_DEPLOY_KEY and MCP_BOOTSTRAP_SECRET are set in Convex env vars.",
    );
  }
  const body = bootstrapResponseSchema.parse(await response.json());
  cachedDeployKey = {
    value: body.deployKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return body.deployKey;
}

const bootstrapResponseSchema = z.object({ deployKey: z.string() });

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

export async function getTableShapes(
  convexUrl: string,
  deployKey: string,
): Promise<Record<string, JsonValue>> {
  const response = await fetch(`${convexUrl}/api/shapes2`, {
    headers: authHeaders(deployKey),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return z.record(z.string(), jsonValue).parse(json);
}

const declaredSchemaValue = z.object({
  active: z.string().nullable(),
});

export interface SchemaTable {
  tableName: string;
  indexes: JsonValue;
  searchIndexes: JsonValue;
  vectorIndexes: JsonValue;
  documentType: JsonValue;
}

const schemaTable = z.object({
  tableName: z.string(),
  indexes: jsonValue,
  searchIndexes: jsonValue,
  vectorIndexes: jsonValue,
  documentType: jsonValue,
});

const activeSchema = z.object({
  tables: z.array(schemaTable),
});

export async function getDeclaredSchema(
  convexUrl: string,
  deployKey: string,
): Promise<SchemaTable[]> {
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({
      path: "_system/frontend/getSchemas",
      args: {},
      format: "json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  const schemaValue = declaredSchemaValue.parse(result.value);
  if (!schemaValue.active) {
    return [];
  }
  const parsed = activeSchema.parse(JSON.parse(schemaValue.active));
  return parsed.tables;
}

export interface PaginationOpts {
  numItems: number;
  cursor: string | null;
}

const paginationResultSchema = z.object({
  page: z.array(jsonValue),
  isDone: z.boolean(),
  continueCursor: z.string(),
});

export type PaginationResult = z.infer<typeof paginationResultSchema>;

export async function queryTableData(
  convexUrl: string,
  deployKey: string,
  table: string,
  order: "asc" | "desc",
  paginationOpts: PaginationOpts,
): Promise<PaginationResult> {
  const response = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({
      path: "_system/cli/tableData",
      args: { table, order, paginationOpts },
      format: "json",
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return paginationResultSchema.parse(result.value);
}

export interface TestQueryResult {
  value: JsonValue;
  logLines: string[];
}

export function wrapQueryHandler(handlerBody: string): string {
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
export async function runTestQuery(
  convexUrl: string,
  deployKey: string,
  source: string,
): Promise<TestQueryResult> {
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
  return {
    value: result.value,
    logLines: result.logLines ?? [],
  };
}

export async function runMutation(
  convexUrl: string,
  deployKey: string,
  functionPath: string,
  args: Record<string, JsonValue>,
): Promise<JsonValue> {
  const response = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return result.value;
}

export async function runAction(
  convexUrl: string,
  deployKey: string,
  functionPath: string,
  args: Record<string, JsonValue>,
): Promise<JsonValue> {
  const response = await fetch(`${convexUrl}/api/action`, {
    method: "POST",
    headers: authHeaders(deployKey),
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  const result = parseConvexResponse(jsonValue.parse(json));
  return result.value;
}

export interface Repo {
  id: string;
  owner: string;
  name: string;
  rootDirectory: string | null;
  mcpRootPrompt: string | null;
}

export async function listRepos(
  convexUrl: string,
  deployKey: string,
): Promise<Repo[]> {
  const source = wrapQueryHandler(
    `const repos = await ctx.db.query("githubRepos").collect();
    return repos.map(r => ({ id: r._id, owner: r.owner, name: r.name, rootDirectory: r.rootDirectory ?? null, mcpRootPrompt: r.mcpRootPrompt ?? null }));`,
  );
  const result = await runTestQuery(convexUrl, deployKey, source);
  return z
    .array(
      z.object({
        id: z.string(),
        owner: z.string(),
        name: z.string(),
        rootDirectory: z.string().nullable(),
        mcpRootPrompt: z.string().nullable(),
      }),
    )
    .parse(result.value);
}

export async function resolveUserByClerkId(
  convexUrl: string,
  deployKey: string,
  clerkUserId: string,
): Promise<string | null> {
  const source = wrapQueryHandler(
    `const user = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", ${JSON.stringify(clerkUserId)})).first();
    return user ? user._id : null;`,
  );
  const result = await runTestQuery(convexUrl, deployKey, source);
  if (typeof result.value === "string") return result.value;
  return null;
}

export async function ensureUserExists(
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

export async function listUserRepos(
  convexUrl: string,
  deployKey: string,
  userId: string,
): Promise<Repo[]> {
  const source = wrapQueryHandler(
    `const userId = ${JSON.stringify(userId)};
    const repos = await ctx.db.query("githubRepos").collect();
    const accessible = [];
    for (const repo of repos) {
      if (repo.connectedBy === userId) {
        accessible.push({ id: repo._id, owner: repo.owner, name: repo.name, rootDirectory: repo.rootDirectory ?? null, mcpRootPrompt: repo.mcpRootPrompt ?? null });
        continue;
      }
      if (repo.teamId) {
        const membership = await ctx.db.query("teamMembers")
          .withIndex("by_team_and_user", q => q.eq("teamId", repo.teamId).eq("userId", userId))
          .first();
        if (membership) {
          accessible.push({ id: repo._id, owner: repo.owner, name: repo.name, rootDirectory: repo.rootDirectory ?? null, mcpRootPrompt: repo.mcpRootPrompt ?? null });
        }
      }
    }
    return accessible;`,
  );
  const result = await runTestQuery(convexUrl, deployKey, source);
  return z
    .array(
      z.object({
        id: z.string(),
        owner: z.string(),
        name: z.string(),
        rootDirectory: z.string().nullable(),
        mcpRootPrompt: z.string().nullable(),
      }),
    )
    .parse(result.value);
}

export async function checkRepoAccess(
  convexUrl: string,
  deployKey: string,
  repoId: string,
  userId: string,
): Promise<boolean> {
  const source = wrapQueryHandler(
    `const repo = await ctx.db.get(${JSON.stringify(repoId)});
    if (!repo) return false;
    const userId = ${JSON.stringify(userId)};
    if (repo.connectedBy === userId) return true;
    if (!repo.teamId) return false;
    const membership = await ctx.db.query("teamMembers")
      .withIndex("by_team_and_user", q => q.eq("teamId", repo.teamId).eq("userId", userId))
      .first();
    return membership !== null;`,
  );
  const result = await runTestQuery(convexUrl, deployKey, source);
  return result.value === true;
}

interface EnvVar {
  key: string;
  value: string;
}

export async function getRepoEnvVars(
  convexUrl: string,
  deployKey: string,
  repoId: string,
  userId: string,
): Promise<EnvVar[]> {
  const response = await fetch(`${toSiteUrl(convexUrl)}/api/mcp/env-vars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ repoId, userId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return z.array(z.object({ key: z.string(), value: z.string() })).parse(json);
}

interface CachedRepoCreds {
  convexUrl: string;
  deployKey: string;
  expiresAt: number;
}

const repoCredentialsCache = new Map<string, CachedRepoCreds>();

export async function getRepoConvexCredentials(
  evaUrl: string,
  evaDeployKey: string,
  repoId: string,
  userId: string,
): Promise<{ convexUrl: string; deployKey: string } | null> {
  const cacheKey = `${userId}:${repoId}`;
  const cached = repoCredentialsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { convexUrl: cached.convexUrl, deployKey: cached.deployKey };
  }

  const vars = await getRepoEnvVars(evaUrl, evaDeployKey, repoId, userId);
  const urlEntry = vars.find(
    (v) => v.key === "NEXT_PUBLIC_CONVEX_URL" || v.key === "CONVEX_URL",
  );
  const keyEntry = vars.find(
    (v) => v.key === "CONVEX_DEPLOY_KEY" || v.key === "CONVEX_ADMIN_KEY",
  );

  if (!urlEntry || !keyEntry) return null;

  const creds = {
    convexUrl: urlEntry.value.replace(/\/$/, ""),
    deployKey: keyEntry.value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  repoCredentialsCache.set(cacheKey, creds);
  return { convexUrl: creds.convexUrl, deployKey: creds.deployKey };
}

let cachedUserJwt: {
  clerkUserId: string;
  jwt: string;
  expiresAt: number;
} | null = null;

export async function signUserJwt(clerkUserId: string): Promise<string> {
  if (
    cachedUserJwt &&
    cachedUserJwt.clerkUserId === clerkUserId &&
    cachedUserJwt.expiresAt > Date.now()
  ) {
    return cachedUserJwt.jwt;
  }

  const privateKeyJson = process.env.SANDBOX_JWT_PRIVATE_KEY;
  if (!privateKeyJson) {
    throw new Error("Missing SANDBOX_JWT_PRIVATE_KEY env var");
  }

  const issuer = process.env.CONVEX_SITE_URL;
  if (!issuer) {
    throw new Error("Missing CONVEX_SITE_URL env var");
  }

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

  cachedUserJwt = {
    clerkUserId,
    jwt,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return jwt;
}

export async function runMutationAsUser(
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
