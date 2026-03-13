import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { ZodTypeAny } from "zod";
import {
  getDeployKey,
  getRepoEnvVars,
  listUserRepos,
  resolveUserByClerkId,
} from "./convex-api.js";
import type { ConvexCredentials } from "./auth.js";

const SUPABASE_PREFIX = "supabase_";
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const CONNECT_TIMEOUT_MS = 15_000;
const CALL_TIMEOUT_MS = 30_000;

const READ_ONLY_TOOLS = new Set([
  "execute_sql",
  "generate_typescript_types",
  "get_anon_key",
  "get_cost",
  "get_logs",
  "get_organization",
  "get_project",
  "get_project_url",
  "list_branches",
  "list_edge_functions",
  "list_extensions",
  "list_migrations",
  "list_organizations",
  "list_projects",
  "list_tables",
]);

interface CachedToken {
  clerkUserId: string;
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function resolveSupabaseToken(
  convexUrl: string,
  clerkUserId: string,
): Promise<string | null> {
  if (
    cachedToken &&
    cachedToken.clerkUserId === clerkUserId &&
    cachedToken.expiresAt > Date.now()
  ) {
    return cachedToken.token;
  }

  const deployKey = await getDeployKey(convexUrl);
  const userId = await resolveUserByClerkId(convexUrl, deployKey, clerkUserId);
  if (!userId) return null;

  const repos = await listUserRepos(convexUrl, deployKey, userId);
  if (repos.length === 0) return null;

  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      const vars = await getRepoEnvVars(convexUrl, deployKey, repo.id, userId);
      const match = vars.find((v) => v.key === "SUPABASE_ACCESS_TOKEN");
      return match ? match.value : null;
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      cachedToken = {
        clerkUserId,
        token: result.value,
        expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
      };
      return result.value;
    }
  }

  return null;
}

function buildChildEnv(token: string): Record<string, string> {
  const env: Record<string, string> = { SUPABASE_ACCESS_TOKEN: token };
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function spawnClient(token: string): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["@supabase/mcp-server-supabase", "--read-only"],
    env: buildChildEnv(token),
  });
  const client = new Client({ name: "eva-supabase-proxy", version: "1.0.0" });
  try {
    await withTimeout(
      client.connect(transport),
      CONNECT_TIMEOUT_MS,
      "Supabase MCP connect",
    );
  } catch (err) {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
    throw err;
  }
  return client;
}

const jsonSchemaPropertySchema = z
  .object({
    type: z.string().optional(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
  })
  .passthrough();

function toZodType(raw: unknown): ZodTypeAny {
  const parsed = jsonSchemaPropertySchema.safeParse(raw);
  if (!parsed.success) return z.string();

  const prop = parsed.data;

  if (prop.enum && prop.enum.length > 0) {
    const zodEnum = z.enum([prop.enum[0], ...prop.enum.slice(1)]);
    return prop.description ? zodEnum.describe(prop.description) : zodEnum;
  }

  let base: ZodTypeAny;
  switch (prop.type) {
    case "number":
    case "integer":
      base = z.number();
      break;
    case "boolean":
      base = z.boolean();
      break;
    case "array":
      base = z.array(z.unknown());
      break;
    case "object":
      base = z.record(z.string(), z.unknown());
      break;
    default:
      base = z.string();
      break;
  }
  return prop.description ? base.describe(prop.description) : base;
}

function toolSchemaToZodShape(
  inputSchema: Tool["inputSchema"],
): Record<string, ZodTypeAny> {
  const shape: Record<string, ZodTypeAny> = {};
  const required = new Set(inputSchema.required ?? []);
  for (const [key, raw] of Object.entries(inputSchema.properties ?? {})) {
    const zodType = toZodType(raw);
    shape[key] = required.has(key) ? zodType : zodType.optional();
  }
  return shape;
}

export async function registerSupabaseTools(
  server: McpServer,
  credentials: ConvexCredentials,
): Promise<void> {
  const { convexUrl, clerkUserId } = credentials;

  let token: string | null;
  try {
    token = await resolveSupabaseToken(convexUrl, clerkUserId);
  } catch (err) {
    console.error("  Supabase: failed to resolve token:", err);
    return;
  }

  if (!token) {
    console.log("  Supabase: no SUPABASE_ACCESS_TOKEN found, skipping");
    return;
  }

  console.log("  Supabase: token found, discovering tools...");

  let tools: Tool[];
  try {
    const client = await spawnClient(token);
    try {
      const result = await withTimeout(
        client.listTools(),
        CONNECT_TIMEOUT_MS,
        "Supabase tools/list",
      );
      tools = result.tools;
    } finally {
      await client.close();
    }
  } catch (err) {
    console.error("  Supabase: failed to discover tools:", err);
    return;
  }

  if (tools.length === 0) {
    console.log("  Supabase: no tools discovered");
    return;
  }

  const readOnlyTools = tools.filter((t) => READ_ONLY_TOOLS.has(t.name));
  const skipped = tools.length - readOnlyTools.length;

  console.log(
    `  Supabase: discovered ${tools.length} tools, registering ${readOnlyTools.length} read-only (skipped ${skipped} write tools)`,
  );

  for (const tool of readOnlyTools) {
    const prefixedName = `${SUPABASE_PREFIX}${tool.name}`;
    const zodShape = toolSchemaToZodShape(tool.inputSchema);

    server.tool(
      prefixedName,
      `[Supabase] ${tool.description ?? tool.name}`,
      zodShape,
      async (args: Record<string, unknown>) => {
        const currentToken = await resolveSupabaseToken(convexUrl, clerkUserId);
        if (!currentToken) {
          return {
            content: [
              {
                type: "text" as const,
                text: "SUPABASE_ACCESS_TOKEN is no longer available.",
              },
            ],
            isError: true,
          };
        }

        try {
          const client = await spawnClient(currentToken);
          try {
            const result = await withTimeout(
              client.callTool({ name: tool.name, arguments: args }),
              CALL_TIMEOUT_MS,
              `Supabase tool ${tool.name}`,
            );

            if (!("content" in result) || !Array.isArray(result.content)) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify(result),
                  },
                ],
              };
            }

            const textContent: Array<{ type: "text"; text: string }> = [];
            for (const item of result.content) {
              if (
                typeof item === "object" &&
                item !== null &&
                "type" in item &&
                item.type === "text" &&
                "text" in item &&
                typeof item.text === "string"
              ) {
                textContent.push({ type: "text" as const, text: item.text });
              }
            }

            return {
              content:
                textContent.length > 0
                  ? textContent
                  : [
                      {
                        type: "text" as const,
                        text: JSON.stringify(result.content),
                      },
                    ],
              isError:
                "isError" in result && result.isError === true
                  ? true
                  : undefined,
            };
          } finally {
            await client.close();
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text" as const,
                text: `Supabase tool error: ${message}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  console.log(`  Supabase: registered ${readOnlyTools.length} read-only tools`);
}
