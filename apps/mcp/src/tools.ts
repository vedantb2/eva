import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ConvexCredentials } from "./auth.js";
import {
  getTableShapes,
  getDeclaredSchema,
  queryTableData,
  runTestQuery,
  wrapQueryHandler,
  getDeployKey,
  listRepos,
  getRepoConvexCredentials,
} from "./convex-api.js";

export function registerTools(
  server: McpServer,
  credentials: ConvexCredentials,
): void {
  const { convexUrl } = credentials;

  async function resolveTarget(
    repoId: string | undefined,
  ): Promise<{ convexUrl: string; deployKey: string }> {
    const deployKey = await getDeployKey(convexUrl);
    if (!repoId) return { convexUrl, deployKey };
    const repoCreds = await getRepoConvexCredentials(
      convexUrl,
      deployKey,
      repoId,
    );
    if (!repoCreds) {
      throw new Error(
        `Repo ${repoId} has no Convex credentials. Ensure NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY are set in its env vars in Conductor.`,
      );
    }
    return repoCreds;
  }

  server.tool(
    "list_repos",
    "List all GitHub repos connected to this Conductor instance. Call this first to let the user choose which codebase to work with.",
    {},
    async () => {
      const deployKey = await getDeployKey(convexUrl);
      const repos = await listRepos(convexUrl, deployKey);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(repos, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "list_tables",
    "List all tables in the Convex deployment with their field definitions, indexes, and inferred shapes. Call this first to understand the data model.",
    {
      repoId: z
        .string()
        .optional()
        .describe(
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Conductor.",
        ),
    },
    async ({ repoId }) => {
      const { convexUrl: targetUrl, deployKey } = await resolveTarget(repoId);
      const [shapes, declaredTables] = await Promise.all([
        getTableShapes(targetUrl, deployKey),
        getDeclaredSchema(targetUrl, deployKey),
      ]);

      const schemaByTable: Record<string, (typeof declaredTables)[number]> = {};
      for (const table of declaredTables) {
        schemaByTable[table.tableName] = table;
      }

      const allTableNames = new Set([
        ...Object.keys(shapes),
        ...Object.keys(schemaByTable),
      ]);
      const sortedNames = Array.from(allTableNames).sort();

      const tables = sortedNames.map((name) => ({
        name,
        declaredSchema: schemaByTable[name] ?? null,
        inferredShape: shapes[name] ?? null,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "query_table",
    "Read a page of documents from a Convex table. Returns documents ordered by creation time. Use the continueCursor for pagination.",
    {
      table: z.string().describe("Table name"),
      order: z
        .enum(["asc", "desc"])
        .default("desc")
        .describe("Sort order by creation time"),
      limit: z
        .number()
        .max(1000)
        .default(100)
        .describe("Max documents to return (default 100, max 1000)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous query"),
      repoId: z
        .string()
        .optional()
        .describe(
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Conductor.",
        ),
    },
    async ({ table, order, limit, cursor, repoId }) => {
      const { convexUrl: targetUrl, deployKey } = await resolveTarget(repoId);
      const result = await queryTableData(targetUrl, deployKey, table, order, {
        numItems: limit,
        cursor: cursor ?? null,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                page: result.page,
                isDone: result.isDone,
                continueCursor: result.continueCursor,
                count: result.page.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "get_document",
    "Get a single document by its Convex document ID.",
    {
      id: z
        .string()
        .describe('The document ID (e.g. "j572abc123..." or "kd83xyz...")'),
      repoId: z
        .string()
        .optional()
        .describe(
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Conductor.",
        ),
    },
    async ({ id, repoId }) => {
      if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid document ID format. IDs should be alphanumeric.",
            },
          ],
          isError: true,
        };
      }
      const { convexUrl: targetUrl, deployKey } = await resolveTarget(repoId);
      const source = wrapQueryHandler(`return await ctx.db.get("${id}");`);
      const result = await runTestQuery(targetUrl, deployKey, source);

      const output: { document: typeof result.value; logLines?: string[] } = {
        document: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "run_query",
    `Run arbitrary read-only Convex query code. This is the most powerful tool — use it for joins, aggregations, filters, and complex data retrieval.

Provide the body of an async handler function. The \`ctx\` object is available with:
- ctx.db.query("tableName") — query a table (supports .filter(), .order(), .collect(), .first(), .take(n))
- ctx.db.get(id) — get a document by ID

Example: "const users = await ctx.db.query('users').collect(); return users.filter(u => u.role === 'admin').length;"`,
    {
      code: z
        .string()
        .describe(
          "The handler body code. Must return a value. Example: \"return await ctx.db.query('users').collect();\"",
        ),
      repoId: z
        .string()
        .optional()
        .describe(
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Conductor.",
        ),
    },
    async ({ code, repoId }) => {
      const { convexUrl: targetUrl, deployKey } = await resolveTarget(repoId);
      const source = wrapQueryHandler(code);
      const result = await runTestQuery(targetUrl, deployKey, source);

      const output: { result: typeof result.value; logLines?: string[] } = {
        result: result.value,
      };
      if (result.logLines.length > 0) {
        output.logLines = result.logLines;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "count_table",
    "Count the total number of documents in a table.",
    {
      table: z.string().describe("Table name"),
      repoId: z
        .string()
        .optional()
        .describe(
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Conductor.",
        ),
    },
    async ({ table, repoId }) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Invalid table name. Use alphanumeric characters and underscores.",
            },
          ],
          isError: true,
        };
      }
      const { convexUrl: targetUrl, deployKey } = await resolveTarget(repoId);
      const source = wrapQueryHandler(
        `const docs = await ctx.db.query("${table}").collect(); return docs.length;`,
      );
      const result = await runTestQuery(targetUrl, deployKey, source);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ table, count: result.value }, null, 2),
          },
        ],
      };
    },
  );
}
