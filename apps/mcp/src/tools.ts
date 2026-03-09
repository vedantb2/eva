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
  runMutation,
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
        `Repo ${repoId} has no Convex credentials. Ensure NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY are set in its env vars in Eva.`,
      );
    }
    return repoCreds;
  }

  server.tool(
    "list_repos",
    "List all GitHub repos connected to this Eva instance. Call this first to let the user choose which codebase to work with.",
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
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Eva.",
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
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Eva.",
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
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Eva.",
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
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Eva.",
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
          "Repo ID from list_repos. When provided, queries that repo's own Convex database instead of Eva.",
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

  server.tool(
    "create_and_run_task",
    `Create a task on the Eva platform and immediately start execution. Use this to send plans, prompts, or instructions to Eva for autonomous execution.

Examples:
- "send this plan to eva and run it" — uses repo defaults
- "run this on eva with sonnet: refactor X to do Y" — overrides model
- "create this as a task on eva on staging" — overrides baseBranch`,
    {
      title: z.string().describe("Short task title"),
      description: z
        .string()
        .describe(
          "The full prompt/plan/instructions for the task (plain text or markdown)",
        ),
      repoName: z
        .string()
        .describe(
          'Repo name (e.g. "conductor" or "vedantb2/conductor"). Resolved to a Convex ID by matching against repo name or fullName.',
        ),
      model: z
        .enum(["opus", "sonnet", "haiku"])
        .optional()
        .describe("Model to use. If omitted, uses the repo's defaultModel."),
      baseBranch: z
        .string()
        .optional()
        .describe(
          "Branch to base work off of. If omitted, uses the repo's defaultBaseBranch.",
        ),
    },
    async ({ title, description, repoName, model, baseBranch }) => {
      const deployKey = await getDeployKey(convexUrl);

      const repos = await listRepos(convexUrl, deployKey);
      const normalizedInput = repoName.toLowerCase();
      const repo = repos.find(
        (r) =>
          r.name.toLowerCase() === normalizedInput ||
          r.fullName.toLowerCase() === normalizedInput,
      );

      if (!repo) {
        const available = repos.map((r) => r.fullName).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Repo "${repoName}" not found. Available repos: ${available}`,
            },
          ],
          isError: true,
        };
      }

      const mutationArgs: Record<string, string> = {
        repoId: repo.id,
        title,
        description,
      };
      if (model !== undefined) {
        mutationArgs.model = model;
      }
      if (baseBranch !== undefined) {
        mutationArgs.baseBranch = baseBranch;
      }

      const taskId = await runMutation(
        convexUrl,
        deployKey,
        "agentTasks/mutations:createQuickTask",
        mutationArgs,
      );

      if (typeof taskId !== "string") {
        return {
          content: [
            {
              type: "text" as const,
              text: "Failed to create task: unexpected response from createQuickTask.",
            },
          ],
          isError: true,
        };
      }

      const executionResult = await runMutation(
        convexUrl,
        deployKey,
        "agentTasks/execution:startExecution",
        { id: taskId },
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                taskId,
                status: "started",
                execution: executionResult,
                message: `Task "${title}" created and execution started on ${repo.fullName}.`,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
